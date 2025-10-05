/**
 * ACF Field Selector for Avada
 * 
 * Adds searchable field selectors to Fusion Builder ACF inputs
 */

class ACFFieldSelector {
    constructor() {
        this.fields = [];
        this.selectors = new WeakMap();
        this.cache = new Map();
        this.config = this.getConfig();
        this.init();
    }

    getConfig() {
        return {
            targets: 'input[name="key"], input[name="field"], input[name="sub_field"], input[name="custom_field_name"], input[name="acf_repeater_field"], input[name="acf_relationship_field"]',
            wrapper: '.dynamic-wrapper, .option-details',
            title: '.dynamic-title :is(h2, h3, h4), .option-details :is(h2, h3, h4)',
            validTitles: ['Custom Field', 'ACF Image', 'ACF Text', 'ACF Number', 'ACF Repeater Sub Field', 'Repeater Field', 'Relationship Field'],
            fieldTypes: {
                'custom_field_name': 'all',
                'acf_repeater_field': 'repeater',
                'acf_relationship_field': 'relationship',
                'sub_field': 'subfield',
                'acf_repeater_sub_field': 'subfield'
            },
            titleToType: {
                'Custom Field': 'all',
                'ACF Image': 'acf_image',
                'ACF Text': 'acf_text',
                'ACF Number': 'acf_number',
                'ACF Repeater Sub Field': 'subfield',
                'Repeater Field': 'repeater',
                'Relationship Field': 'relationship'
            },
            subfieldInputs: ['sub_field', 'acf_repeater_sub_field'],
            alwaysExcludedTypes: ['tab', 'message', 'accordion'],
            labels: {
                'custom_field_name': 'Find Custom',
                'acf_repeater_field': 'Find Repeater',
                'acf_relationship_field': 'Find Relationship',
                'sub_field': 'Find Sub Field',
                'all': 'Find Field',
                'repeater': 'Find Repeater',
                'relationship': 'Find Relationship',
                'subfield': 'Find Sub Field'
            }
        };
    }

    async init() {
        try {
            await this.loadFields();
            this.bindEvents();
            this.processExisting();
        } catch (error) {
            console.error('ACF Selector initialization failed:', error);
        }
    }

    async loadFields() {
        if (this.cache.has('fields')) {
            this.fields = this.cache.get('fields');
            return;
        }

        const response = await this.fetchFields();

        if (response.success) {
            this.fields = response.data;
            this.cache.set('fields', this.fields);
        } else {
            throw new Error(response.data || 'Failed to load fields');
        }
    }

    async fetchFields() {
        if (!afsaAjax || !afsaAjax.nonce) {
            throw new Error('Security token missing');
        }

        const formData = new FormData();
        formData.append('action', 'get_acf_fields');
        formData.append('nonce', afsaAjax.nonce);

        const response = await fetch(afsaAjax.ajax_url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response failed');
        }

        return await response.json();
    }

    bindEvents() {
        const observer = new MutationObserver(this.debounce(() => this.processExisting(), 300));
        observer.observe(document.body, { childList: true, subtree: true });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.afsa-selector')) {
                this.closeAll();
            }
        });

        this.observer = observer;
    }

    processExisting() {
        document.querySelectorAll(this.config.targets).forEach(input => {
            if (!this.selectors.has(input)) {
                this.attachSelector(input);
            }
        });
    }

    attachSelector(input) {
        const context = this.getContext(input);
        if (!context) return;

        const selector = this.createSelector(input, context);
        input.parentNode.insertBefore(selector, input.nextSibling);
        this.selectors.set(input, selector);
    }

    getContext(input) {
        const name = input.name;

        if (this.config.fieldTypes[name]) {
            return {
                type: this.config.fieldTypes[name],
                label: this.config.labels[name] || 'Find ACF',
                isSubfield: this.config.subfieldInputs.includes(name)
            };
        }

        return this.getContextFromWrapper(input);
    }

    getContextFromWrapper(input) {
        const wrapper = input.closest(this.config.wrapper);
        if (!wrapper) return null;

        const titleEl = wrapper.querySelector(this.config.title);
        const title = titleEl?.textContent.trim();

        if (!this.config.validTitles.includes(title)) return null;

        const type = this.config.titleToType[title] || 'all';
        const label = this.config.labels[type] || 'Find Field';

        return {
            type: type,
            label: label,
            isSubfield: type === 'subfield'
        };
    }

    createSelector(input, context) {
        const container = this.createElement('div', 'afsa-selector');
        const btn = this.createButton(context.label);
        const dropdown = this.createDropdown(context);

        container.append(btn, dropdown);
        this.bindSelectorEvents(btn, dropdown, input, context);

        return container;
    }

    createElement(tag, className) {
        const el = document.createElement(tag);
        el.className = className;
        return el;
    }

    createButton(label) {
        const btn = this.createElement('button', 'afsa-btn');
        btn.type = 'button';
        btn.textContent = label;
        return btn;
    }

    createDropdown(context) {
        const dropdown = this.createElement('div', 'afsa-dropdown');
        dropdown.style.display = 'none';

        const search = this.createElement('input', 'afsa-search');
        search.type = 'text';
        search.placeholder = 'Search...';

        const list = this.createElement('div', 'afsa-list');
        this.populateList(list, context.type, context.isSubfield);

        dropdown.append(search, list);

        return dropdown;
    }

    populateList(list, filterType, isSubfield) {
        const fields = this.filterFields(filterType);
        const groups = this.groupFields(fields);

        list.innerHTML = '';

        Object.entries(groups).forEach(([groupName, groupFields]) => {
            const groupEl = this.createGroup(groupName, groupFields, isSubfield);
            list.appendChild(groupEl);
        });
    }

    createGroup(groupName, groupFields, isSubfield) {
        const groupEl = this.createElement('div', 'afsa-group');
        groupEl.innerHTML = '<div class="afsa-group-title">' + this.escapeHtml(groupName) + '</div>';

        groupFields.forEach(field => {
            if (this.isFieldSelectable(field)) {
                groupEl.appendChild(this.createFieldItem(field, isSubfield));
            }
        });

        return groupEl;
    }

    isFieldSelectable(field) {
        return field.name && !this.config.alwaysExcludedTypes.includes(field.type);
    }

    createFieldItem(field, isSubfield) {
        const item = this.createElement('div', 'afsa-item');
        const displayName = isSubfield ? (field.base_name || field.name) : field.name;

        item.dataset.name = field.name;
        item.dataset.baseName = field.base_name || field.name;
        item.dataset.parent = field.parent || '';
        item.dataset.isRepeaterChild = field.is_repeater_child ? '1' : '0';

        item.innerHTML = '<span class="afsa-label">' + this.escapeHtml(field.label) + '</span>' +
            '<code class="afsa-name">' + this.escapeHtml(displayName) + '</code>' +
            '<span class="afsa-type">' + this.escapeHtml(field.type) + '</span>';

        return item;
    }

    filterFields(type) {
        const filters = {
            'all': f => f.type !== 'repeater',
            'acf_image': f => f.type === 'image',
            'acf_text': f => ['text', 'textarea', 'wysiwyg'].includes(f.type),
            'acf_number': f => f.type === 'number',
            'acf_repeater_sub_field': f => f.is_repeater_child,
            'subfield': f => f.is_repeater_child,
            'repeater': f => f.type === 'repeater',
            'relationship': f => f.type === 'relationship'
        };

        const filter = filters[type] || (() => true);

        return this.fields.filter(f => this.isFieldSelectable(f) && filter(f));
    }

    groupFields(fields) {
        return fields.reduce((groups, field) => {
            const group = field.group || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(field);
            return groups;
        }, {});
    }

    bindSelectorEvents(btn, dropdown, input, context) {
        const search = dropdown.querySelector('.afsa-search');
        const list = dropdown.querySelector('.afsa-list');

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDropdown(dropdown, search);
        });

        search.addEventListener('input', (e) => {
            this.filterList(list, e.target.value.toLowerCase());
        });

        list.addEventListener('click', (e) => {
            this.handleFieldSelect(e, input, context, dropdown);
        });
    }

    toggleDropdown(dropdown, search) {
        const isVisible = dropdown.style.display !== 'none';
        this.closeAll();

        if (!isVisible) {
            dropdown.style.display = 'block';
            search.focus();
        }
    }

    handleFieldSelect(e, input, context, dropdown) {
        const item = e.target.closest('.afsa-item');
        if (!item) return;

        const value = context.isSubfield ? item.dataset.baseName : item.dataset.name;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        dropdown.style.display = 'none';
    }

    filterList(list, term) {
        const items = list.querySelectorAll('.afsa-item');
        const groups = list.querySelectorAll('.afsa-group');

        if (!term) {
            this.showAll(items, groups);
            return;
        }

        this.filterItems(items, term);
        this.filterGroups(groups);
    }

    showAll(items, groups) {
        items.forEach(item => item.style.display = '');
        groups.forEach(group => group.style.display = '');
    }

    filterItems(items, term) {
        items.forEach(item => {
            const name = item.querySelector('.afsa-name').textContent.toLowerCase();
            const label = item.querySelector('.afsa-label').textContent.toLowerCase();
            item.style.display = (name.includes(term) || label.includes(term)) ? '' : 'none';
        });
    }

    filterGroups(groups) {
        groups.forEach(group => {
            const visibleItems = group.querySelectorAll('.afsa-item:not([style*="none"])');
            group.style.display = visibleItems.length ? '' : 'none';
        });
    }

    closeAll() {
        document.querySelectorAll('.afsa-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.cache.clear();
        this.selectors = new WeakMap();
        this.fields = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof afsaAjax !== 'undefined') {
        window.afsaSelector = new ACFFieldSelector();
    }
});