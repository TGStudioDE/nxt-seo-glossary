(function(wp) {
    const { registerBlockType } = wp.blocks;
    const { InspectorControls } = wp.blockEditor;
    const { PanelBody, RangeControl, SelectControl, ToggleControl } = wp.components;
    const { __ } = wp.i18n;

    registerBlockType('nxt-seo-glossary/glossary', {
        title: __('SEO Glossary', 'nxt-seo-glossary'),
        description: __('Display a searchable glossary of SEO terms with sorting options.', 'nxt-seo-glossary'),
        icon: 'book',
        category: 'widgets',
        attributes: {
            initialCount: {
                type: 'number',
                default: 10
            },
            sortBy: {
                type: 'string',
                default: 'title'
            },
            sortOrder: {
                type: 'string',
                default: 'asc'
            },
            showSearch: {
                type: 'boolean',
                default: true
            }
        },
        edit: function(props) {
            const { attributes, setAttributes } = props;

            return wp.element.createElement(
                'div',
                { className: 'nxt-glossary-block-editor' },
                wp.element.createElement(
                    InspectorControls,
                    null,
                    wp.element.createElement(
                        PanelBody,
                        { title: __('Glossary Settings', 'nxt-seo-glossary') },
                        wp.element.createElement(
                            RangeControl,
                            {
                                label: __('Initial Terms Count', 'nxt-seo-glossary'),
                                value: attributes.initialCount,
                                onChange: (value) => setAttributes({ initialCount: value }),
                                min: 1,
                                max: 50
                            }
                        ),
                        wp.element.createElement(
                            SelectControl,
                            {
                                label: __('Sort By', 'nxt-seo-glossary'),
                                value: attributes.sortBy,
                                options: [
                                    { label: __('Title', 'nxt-seo-glossary'), value: 'title' },
                                    { label: __('Date', 'nxt-seo-glossary'), value: 'date' },
                                    { label: __('Modified Date', 'nxt-seo-glossary'), value: 'modified' }
                                ],
                                onChange: (value) => setAttributes({ sortBy: value })
                            }
                        ),
                        wp.element.createElement(
                            SelectControl,
                            {
                                label: __('Sort Order', 'nxt-seo-glossary'),
                                value: attributes.sortOrder,
                                options: [
                                    { label: __('Ascending', 'nxt-seo-glossary'), value: 'asc' },
                                    { label: __('Descending', 'nxt-seo-glossary'), value: 'desc' }
                                ],
                                onChange: (value) => setAttributes({ sortOrder: value })
                            }
                        ),
                        wp.element.createElement(
                            ToggleControl,
                            {
                                label: __('Show Search', 'nxt-seo-glossary'),
                                checked: attributes.showSearch,
                                onChange: (value) => setAttributes({ showSearch: value })
                            }
                        )
                    )
                ),
                wp.element.createElement(
                    'div',
                    { className: 'nxt-glossary-block-placeholder' },
                    __('SEO Glossary Block', 'nxt-seo-glossary')
                )
            );
        },
        save: function() {
            return null;
        }
    });
})(window.wp);
