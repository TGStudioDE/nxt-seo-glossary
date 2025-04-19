<?php
if (!defined('ABSPATH')) {
    exit;
}

class NXT_Glossary_Ajax {
    public function __construct() {
        add_action('wp_ajax_nxt_glossary_search', [$this, 'handle_search']);
        add_action('wp_ajax_nopriv_nxt_glossary_search', [$this, 'handle_search']);
        add_action('wp_ajax_nxt_glossary_load_more', [$this, 'handle_load_more']);
        add_action('wp_ajax_nopriv_nxt_glossary_load_more', [$this, 'handle_load_more']);
    }

    public function handle_search() {
        check_ajax_referer('nxt-glossary-nonce', 'nonce');

        $search_term = isset($_POST['term']) ? sanitize_text_field($_POST['term']) : '';
        $sort_by = isset($_POST['sort_by']) ? sanitize_text_field($_POST['sort_by']) : 'title';
        $sort_order = isset($_POST['sort_order']) ? sanitize_text_field($_POST['sort_order']) : 'asc';

        $args = [
            'post_type' => 'glossar',
            'posts_per_page' => -1,
            'orderby' => $sort_by,
            'order' => $sort_order,
            's' => $search_term
        ];

        $query = new WP_Query($args);
        $results = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $results[] = [
                    'id' => get_the_ID(),
                    'title' => get_the_title(),
                    'excerpt' => wp_trim_words(wp_strip_all_tags(get_the_content()), 30),
                    'content' => get_the_content()
                ];
            }
        }

        wp_send_json_success($results);
    }

    public function handle_load_more() {
        check_ajax_referer('nxt-glossary-nonce', 'nonce');

        $page = isset($_POST['page']) ? absint($_POST['page']) : 1;
        $per_page = isset($_POST['per_page']) ? absint($_POST['per_page']) : 10;
        $sort_by = isset($_POST['sort_by']) ? sanitize_text_field($_POST['sort_by']) : 'title';
        $sort_order = isset($_POST['sort_order']) ? sanitize_text_field($_POST['sort_order']) : 'asc';

        $args = [
            'post_type' => 'glossar',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => $sort_by,
            'order' => $sort_order
        ];

        $query = new WP_Query($args);
        $results = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $results[] = [
                    'id' => get_the_ID(),
                    'title' => get_the_title(),
                    'excerpt' => wp_trim_words(wp_strip_all_tags(get_the_content()), 30),
                    'content' => get_the_content()
                ];
            }
        }

        wp_send_json_success([
            'terms' => $results,
            'has_more' => $page < $query->max_num_pages
        ]);
    }
} 