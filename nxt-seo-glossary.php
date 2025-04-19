<?php
/**
 * Plugin Name: NXT SEO Glossary
 * Plugin URI: https://nextab.de
 * Description: A custom WordPress plugin for creating and managing SEO glossary terms with Gutenberg block support.
 * Version: 1.0.0
 * Author: nexTab – Oliver Gehrmann
 * Author URI: https://nextab.de
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: nxt-seo-glossary
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('NXT_SEO_GLOSSARY_VERSION', '1.0.0');
define('NXT_SEO_GLOSSARY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NXT_SEO_GLOSSARY_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once NXT_SEO_GLOSSARY_PLUGIN_DIR . 'includes/class-nxt-glossary-block.php';
require_once NXT_SEO_GLOSSARY_PLUGIN_DIR . 'includes/class-nxt-glossary-ajax.php';

// Initialize the plugin
function nxt_seo_glossary_init() {
    // Load text domain
    load_plugin_textdomain('nxt-seo-glossary', false, dirname(plugin_basename(__FILE__)) . '/languages');
    
    // Initialize classes
    new NXT_Glossary_Block();
    new NXT_Glossary_Ajax();
}
add_action('init', 'nxt_seo_glossary_init');

// Debug function to help diagnose issues
function nxt_glossary_debug_info() {
    if (current_user_can('manage_options') && isset($_GET['nxt_debug'])) {
        echo '<div style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 15px; position: fixed; bottom: 0; right: 0; z-index: 9999; max-width: 500px;">';
        echo '<h3>NXT Glossary Debug Info</h3>';
        
        // Check if post type exists
        $post_types = get_post_types([], 'names');
        echo '<p>Glossar post type registered: ' . (in_array('glossar', $post_types) ? 'Yes' : 'No') . '</p>';
        
        // Count glossary terms
        $terms_count = wp_count_posts('glossar');
        echo '<p>Glossary terms count: ' . ($terms_count ? $terms_count->publish : '0') . '</p>';
        
        // Check if scripts are enqueued
        echo '<p>Frontend script handle: ' . (wp_script_is('nxt-glossary-block-frontend', 'enqueued') ? 'Enqueued' : 'Not enqueued') . '</p>';
        
        echo '</div>';
    }
}
add_action('wp_footer', 'nxt_glossary_debug_info');
