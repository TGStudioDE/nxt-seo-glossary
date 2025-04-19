<?php
if (!defined('ABSPATH')) {
    exit;
}

class NXT_Glossary_Block {
    public function __construct() {
        add_action('init', [$this, 'register_block']);
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        
        // Register a shortcode as a fallback
        add_shortcode('nxt_glossary', [$this, 'render_shortcode']);
    }

    public function register_block() {
        // Register block type with simplified approach
        register_block_type('nxt-seo-glossary/glossary', [
            'render_callback' => [$this, 'render_shortcode'], // Use the same function as the shortcode
            'attributes' => [
                'initialCount' => [
                    'type' => 'number',
                    'default' => 10
                ],
                'sortBy' => [
                    'type' => 'string',
                    'default' => 'title'
                ],
                'sortOrder' => [
                    'type' => 'string',
                    'default' => 'asc'
                ],
                'showSearch' => [
                    'type' => 'boolean',
                    'default' => true
                ]
            ]
        ]);
    }

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'nxt-glossary-block-editor',
            NXT_SEO_GLOSSARY_PLUGIN_URL . 'assets/js/nxt-glossary-block-editor.js',
            ['wp-blocks', 'wp-element', 'wp-components', 'wp-editor', 'wp-i18n'],
            NXT_SEO_GLOSSARY_VERSION
        );

        wp_enqueue_style(
            'nxt-glossary-block-editor',
            NXT_SEO_GLOSSARY_PLUGIN_URL . 'assets/css/nxt-glossary-block-editor.css',
            [],
            NXT_SEO_GLOSSARY_VERSION
        );
    }

    public function enqueue_frontend_assets() {
        wp_enqueue_style(
            'nxt-glossary-block-frontend',
            NXT_SEO_GLOSSARY_PLUGIN_URL . 'assets/css/nxt-glossary-block-frontend.css',
            [],
            NXT_SEO_GLOSSARY_VERSION
        );

        wp_enqueue_script(
            'nxt-glossary-block-frontend',
            NXT_SEO_GLOSSARY_PLUGIN_URL . 'assets/js/nxt-glossary-block-frontend.js',
            [],
            NXT_SEO_GLOSSARY_VERSION,
            true
        );

        wp_localize_script('nxt-glossary-block-frontend', 'nxtGlossary', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('nxt-glossary-nonce'),
            'debug' => true
        ]);
    }

    /**
     * Render function that handles both shortcode and block rendering
     */
    public function render_shortcode($atts = []) {
        // Set default attributes
        $default_atts = [
            'initial_count' => 10,
            'sort_by' => 'title',
            'sort_order' => 'asc',
            'show_search' => 'true',
        ];
        
        // Handle both block attributes and shortcode attributes
        if (isset($atts['initialCount'])) {
            // Block format (camelCase)
            $attributes = [
                'initialCount' => isset($atts['initialCount']) ? $atts['initialCount'] : 10,
                'sortBy' => isset($atts['sortBy']) ? $atts['sortBy'] : 'title',
                'sortOrder' => isset($atts['sortOrder']) ? $atts['sortOrder'] : 'asc',
                'showSearch' => isset($atts['showSearch']) ? $atts['showSearch'] : true,
            ];
        } else {
            // Shortcode format (snake_case)
            $atts = shortcode_atts($default_atts, $atts, 'nxt_glossary');
            
            // Convert to block attribute format
            $attributes = [
                'initialCount' => intval($atts['initial_count']),
                'sortBy' => $atts['sort_by'],
                'sortOrder' => $atts['sort_order'],
                'showSearch' => $atts['show_search'] === 'true',
            ];
        }
        
        // Basic CSS for the glossary
        $output = '<style>
            .nxt-glossary-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .nxt-glossary-search {
                margin-bottom: 20px;
            }
            .nxt-glossary-search-input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .nxt-glossary-terms {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .nxt-glossary-term {
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .nxt-glossary-term-title {
                margin-top: 0;
                color: #333;
            }
            .nxt-glossary-term-content {
                color: #666;
            }
            .nxt-glossary-term details {
                border: none;
            }
            .nxt-glossary-term summary {
                cursor: pointer;
                list-style: none;
            }
            .nxt-glossary-term summary::-webkit-details-marker {
                display: none;
            }
            .nxt-glossary-pagination {
                margin-top: 20px;
                text-align: center;
            }
            .nxt-glossary-load-more {
                background: #2271b1;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            .nxt-glossary-load-more:hover {
                background: #135e96;
            }
        </style>';
        
        // Container start with added data attributes for JS initialization
        $output .= '<div class="nxt-glossary-container nxt-glossary-block" id="nxt-glossary-block-container" 
            data-initial-count="' . esc_attr($attributes['initialCount']) . '" 
            data-sort-by="' . esc_attr($attributes['sortBy']) . '" 
            data-sort-order="' . esc_attr($attributes['sortOrder']) . '" 
            data-show-search="' . esc_attr($attributes['showSearch'] ? 'true' : 'false') . '">';
        
        // Search bar
        if ($attributes['showSearch']) {
            $output .= '<div class="nxt-glossary-search">
                <input type="text" class="nxt-glossary-search-input" placeholder="Search terms...">
            </div>';
        }
        
        // Query glossary terms
        $args = [
            'post_type' => 'glossar',
            'posts_per_page' => $attributes['initialCount'],
            'orderby' => $attributes['sortBy'],
            'order' => $attributes['sortOrder']
        ];
        
        $query = new WP_Query($args);
        
        // Terms container
        $output .= '<div class="nxt-glossary-terms">';
        
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $title = get_the_title();
                $excerpt = wp_trim_words(get_the_content(), 30);
                $content = get_the_content();
                
                $output .= '<div class="nxt-glossary-term">
                    <details>
                        <summary>
                            <h3 class="nxt-glossary-term-title">' . esc_html($title) . '</h3>
                            <div class="nxt-glossary-term-excerpt">' . esc_html($excerpt) . '</div>
                        </summary>
                        <div class="nxt-glossary-term-content">' . wp_kses_post($content) . '</div>
                    </details>
                </div>';
            }
        } else {
            $output .= '<p>No glossary terms found. Please add some terms to the glossar post type.</p>';
        }
        
        $output .= '</div>'; // Close terms container
        
        // Add Load More button for pagination
        if ($query->max_num_pages > 1) {
            $output .= '<div class="nxt-glossary-pagination">
                <button class="nxt-glossary-load-more">Load More Terms</button>
            </div>';
        }
        
        $output .= '</div>'; // Close container
        
        wp_reset_postdata();
        return $output;
    }
} 