class ACFFieldSelector {
    constructor() {
        this.fields = [];
        this.selectors = new WeakMap();
        this.cache = new Map();
        this.config = {
            targets: 'input[name="key"], input[name="field"], input[name="sub_field"], input[name="custom_field_name"], input[name="acf_repeater_field"], input[name="acf_relationship_field"], .fusion-logic-additionals-field',
            wrapper: '.dynamic-wrapper, .option-details',
            title: '.dynamic-title h3, .option-details h3',
            validTitles: ['Custom Field', 'ACF Image', 'ACF Text', 'ACF Number', 'ACF Repeater Sub Field', 'Repeater Field', 'Relationship Field'],
            fieldTypes: {
                'custom_field_name': 'all',
                'acf_repeater_field': 'repeater',
                'acf_relationship_field': 'relationship',
                'sub_field': 'subfield',
                'acf_repeater_sub_field': 'subfield'
            },
            subfieldInputs: ['sub_field', 'acf_repeater_sub_field'],
            excludedTypes: ['tab', 'message', 'accordion'],
            labels: {
                'custom_field_name': 'Find Custom Field',
                'acf_repeater_field': 'Find Repeater',
                'acf_relationship_field': 'Find Relationship',
                'sub_field': 'Find Sub Field'
            }
        };
        this.init();
    }

    async init() {
        try {
            await this.loadFields();
            this.bindEvents();
            this.processExisting();
        } catch (error) {
            console.error('ACF Selector failed:', error);
        }
    }

    async loadFields() {
        if (this.cache.has('fields')) {
            this.fields = this.cache.get('fields');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'get_acf_fields');
        formData.append('nonce', afsaAjax.nonce);

        const response = await fetch(afsaAjax.ajax_url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            this.fields = data.data;
            this.cache.set('fields', this.fields);
        }
    }

    bindEvents() {
        const observer = new MutationObserver(() => {
            clearTimeout(this.mutationTimer);
            this.mutationTimer = setTimeout(() => this.processExisting(), 300);
        });
        
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

        if (input.classList.contains('fusion-logic-additionals-field')) {
            return {
                type: 'all',
                label: 'Find Field',
                isSubfield: false
            };
        }

        const wrapper = input.closest(this.config.wrapper);
        if (!wrapper) return null;

        const titleEl = wrapper.querySelector(this.config.title);
        if (!titleEl) return null;

        const title = titleEl.textContent.trim();
        if (!this.config.validTitles.includes(title)) return null;

        const cleanLabel = title === 'ACF Repeater Sub Field' 
            ? 'Find Sub Field' 
            : 'Find ' + title.replace('ACF ', '');

        return {
            type: title.toLowerCase().replace(/\s+/g, '_'),
            label: cleanLabel,
            isSubfield: title === 'ACF Repeater Sub Field'
        };
    }

    createSelector(input, context) {
        const container = document.createElement('div');
        container.className = 'afsa-selector';

        const btn = document.createElement('button');
        btn.className = 'afsa-btn';
        btn.type = 'button';
        btn.textContent = context.label;

        const dropdown = this.createDropdown(context);

        container.appendChild(btn);
        container.appendChild(dropdown);

        this.bindSelectorEvents(btn, dropdown, input, context);

        return container;
    }

    createDropdown(context) {
        const dropdown = document.createElement('div');
        dropdown.className = 'afsa-dropdown';
        dropdown.style.display = 'none';

        const search = document.createElement('input');
        search.className = 'afsa-search';
        search.type = 'text';
        search.placeholder = 'Search...';

        const list = document.createElement('div');
        list.className = 'afsa-list';
        this.populateList(list, context.type, context.isSubfield);

        dropdown.appendChild(search);
        dropdown.appendChild(list);

        return dropdown;
    }

    populateList(list, filterType, isSubfield) {
        const fields = this.filterFields(filterType);
        const groups = this.groupFields(fields);

        list.innerHTML = '';

        Object.entries(groups).forEach(([groupName, groupFields]) => {
            const groupEl = document.createElement('div');
            groupEl.className = 'afsa-group';
            groupEl.innerHTML = '<div class="afsa-group-title">' + this.escapeHtml(groupName) + '</div>';

            groupFields.forEach(field => {
                if (field.name && !this.config.excludedTypes.includes(field.type)) {
                    groupEl.appendChild(this.createFieldItem(field, isSubfield));
                }
            });

            list.appendChild(groupEl);
        });
    }

    createFieldItem(field, isSubfield) {
        const item = document.createElement('div');
        item.className = 'afsa-item';
        const displayName = isSubfield ? (field.base_name || field.name) : field.name;

        item.dataset.name = field.name;
        item.dataset.baseName = field.base_name || field.name;

        item.innerHTML = 
            '<span class="afsa-type">' + this.escapeHtml(field.type) + '</span>' +
            '<span class="afsa-label">' + this.escapeHtml(field.label) + '</span>' +
            '<code class="afsa-name">' + this.escapeHtml(displayName) + '</code>';

        return item;
    }

    filterFields(type) {
        const filters = {
            'acf_image': f => f.type === 'image',
            'acf_text': f => ['text', 'textarea', 'wysiwyg'].includes(f.type),
            'acf_number': f => f.type === 'number',
            'acf_repeater_sub_field': f => f.is_repeater_child,
            'subfield': f => f.is_repeater_child,
            'repeater': f => f.type === 'repeater',
            'relationship': f => f.type === 'relationship'
        };

        const filter = filters[type] || (() => true);
        return this.fields.filter(filter);
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
            const item = e.target.closest('.afsa-item');
            if (!item) return;

            const value = context.isSubfield ? item.dataset.baseName : item.dataset.name;
            input.value = value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            dropdown.style.display = 'none';
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

    filterList(list, term) {
        const items = list.querySelectorAll('.afsa-item');
        const groups = list.querySelectorAll('.afsa-group');

        if (!term) {
            items.forEach(item => item.style.display = '');
            groups.forEach(group => group.style.display = '');
            return;
        }

        items.forEach(item => {
            const name = item.querySelector('.afsa-name').textContent.toLowerCase();
            const label = item.querySelector('.afsa-label').textContent.toLowerCase();
            item.style.display = (name.includes(term) || label.includes(term)) ? '' : 'none';
        });

        groups.forEach(group => {
            const visible = group.querySelectorAll('.afsa-item:not([style*="none"])');
            group.style.display = visible.length ? '' : 'none';
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof afsaAjax !== 'undefined') {
        window.afsaSelector = new ACFFieldSelector();
    }
});