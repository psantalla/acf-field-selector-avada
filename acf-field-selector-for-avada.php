<?php
/**
 * Plugin Name: ACF Field Selector for Avada
 * Plugin URI: https://github.com/psantalla/acf-field-selector-avada
 * Description: Adds searchable ACF field selectors to Fusion Builder dynamic content fields.
 * Version: 1.0.0
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Author: Pablo Santalla
 * Author URI: https://pablosantalla.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: acf-field-selector-avada
 */

if (!defined('ABSPATH')) {
    exit;
}

class ACF_Field_Selector_Avada {
    
    private $cache_key = 'afsa_fields_cache';
    private $cache_expiry = 3600;
    
    public function __construct() {
        if (!function_exists('acf_get_field_groups')) {
            return;
        }
        
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_get_acf_fields', array($this, 'ajax_get_fields'));
        add_action('acf/save_post', array($this, 'clear_cache'));
    }
    
    public function enqueue_assets($hook) {
        if (!$this->should_enqueue($hook)) {
            return;
        }
        
        $version = defined('WP_DEBUG') && WP_DEBUG ? time() : '1.0.0';
        
        wp_enqueue_script(
            'afsa-selector', 
            plugin_dir_url(__FILE__) . 'assets/selector.js', 
            array('jquery'), 
            $version, 
            true
        );
        
        wp_enqueue_style(
            'afsa-selector', 
            plugin_dir_url(__FILE__) . 'assets/selector.css', 
            array(), 
            $version
        );
        
        wp_localize_script('afsa-selector', 'afsaAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('afsa_fields_nonce')
        ));
    }
    
    private function should_enqueue($hook) {
        global $post;
        
        return (
            strpos($hook, 'fusion') !== false ||
            (isset($_GET['fb-edit']) && $_GET['fb-edit'] === '1') ||
            get_post_type() === 'fusion_element' ||
            is_admin() ||
            ($post && isset($post->post_content) && strpos($post->post_content, 'fusion') !== false)
        );
    }
    
    public function ajax_get_fields() {
        check_ajax_referer('afsa_fields_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Unauthorized');
        }
        
        wp_send_json_success($this->get_cached_fields());
    }
    
    private function get_cached_fields() {
        $cached = get_transient($this->cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        $fields = $this->fetch_acf_fields();
        set_transient($this->cache_key, $fields, $this->cache_expiry);
        
        return $fields;
    }
    
    private function fetch_acf_fields() {
        if (!function_exists('acf_get_field_groups')) {
            return array();
        }
        
        $fields = array();
        
        foreach (acf_get_field_groups() as $group) {
            $group_fields = acf_get_fields($group['key']);
            
            if ($group_fields) {
                foreach ($group_fields as $field) {
                    $this->process_field($field, $group['title'], $fields);
                }
            }
        }
        
        return $fields;
    }
    
    private function process_field($field, $group_title, &$fields, $name_chain = array(), $label_chain = array(), $is_repeater_child = false) {
        if ($this->should_skip_field($field)) {
            return;
        }
        
        if ($field['type'] === 'group') {
            $this->process_group($field, $group_title, $fields, $name_chain, $label_chain, $is_repeater_child);
            return;
        }
        
        $fields[] = $this->build_field_data($field, $group_title, $name_chain, $label_chain, $is_repeater_child);
        
        if (isset($field['sub_fields']) && is_array($field['sub_fields'])) {
            $this->process_subfields($field, $group_title, $fields, $name_chain, $label_chain);
        }
    }
    
    private function should_skip_field($field) {
        return in_array($field['type'], array('tab', 'message', 'accordion'));
    }
    
    private function process_group($field, $group_title, &$fields, $name_chain, $label_chain, $is_repeater_child) {
        if (!isset($field['sub_fields']) || !is_array($field['sub_fields'])) {
            return;
        }
        
        $new_name_chain = array_merge($name_chain, array($field['name']));
        $new_label_chain = array_merge($label_chain, array($field['label']));
        
        foreach ($field['sub_fields'] as $sub_field) {
            $this->process_field($sub_field, $group_title, $fields, $new_name_chain, $new_label_chain, $is_repeater_child);
        }
    }
    
    private function process_subfields($field, $group_title, &$fields, $name_chain, $label_chain) {
        $new_label_chain = array_merge($label_chain, array($field['label']));
        
        foreach ($field['sub_fields'] as $sub_field) {
            $this->process_field($sub_field, $group_title, $fields, $name_chain, $new_label_chain, true);
        }
    }
    
    private function build_field_data($field, $group_title, $name_chain, $label_chain, $is_repeater_child) {
        return array(
            'name' => sanitize_text_field($this->build_field_name($field['name'], $name_chain)),
            'label' => sanitize_text_field($this->build_field_label($field['label'], $label_chain)),
            'type' => sanitize_text_field($field['type']),
            'group' => sanitize_text_field($group_title),
            'parent' => $this->get_parent($name_chain),
            'base_name' => sanitize_text_field($field['name']),
            'is_repeater_child' => $is_repeater_child
        );
    }
    
    private function build_field_name($name, $chain) {
        return empty($chain) ? $name : implode('_', array_merge($chain, array($name)));
    }
    
    private function build_field_label($label, $chain) {
        return empty($chain) ? $label : implode(' → ', array_merge($chain, array($label)));
    }
    
    private function get_parent($chain) {
        return !empty($chain) ? sanitize_text_field(end($chain)) : '';
    }
    
    public function clear_cache() {
        delete_transient($this->cache_key);
    }
}

new ACF_Field_Selector_Avada();