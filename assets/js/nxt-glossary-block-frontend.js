// Debug function to log DOM structure
function debugDOM() {
    console.log('Debugging DOM Structure');
    
    // Log all blocks (should match our selector)
    const allDivs = document.querySelectorAll('div');
    console.log(`Total divs on page: ${allDivs.length}`);
    
    // Look for our specific classes
    console.log(`Elements with .nxt-glossary-block class: ${document.querySelectorAll('.nxt-glossary-block').length}`);
    console.log(`Elements with .nxt-glossary-container class: ${document.querySelectorAll('.nxt-glossary-container').length}`);
    console.log(`Elements with .nxt-glossary-terms class: ${document.querySelectorAll('.nxt-glossary-terms').length}`);
    console.log(`Elements with .nxt-glossary-term class: ${document.querySelectorAll('.nxt-glossary-term').length}`);
    
    // Check raw HTML content
    console.log('Checking raw HTML for glossary container...');
    const htmlContent = document.documentElement.innerHTML;
    if (htmlContent.indexOf('nxt-glossary-block') !== -1 || htmlContent.indexOf('nxt-glossary-container') !== -1) {
        console.log('Found glossary in raw HTML!');
        
        // Check if block is wrapped in HTML comments (WordPress sometimes does this)
        const commentRegex = /<!--.*?nxt-glossary.*?-->/gs;
        const commentMatches = htmlContent.match(commentRegex);
        if (commentMatches && commentMatches.length > 0) {
            console.error('FOUND BLOCK IN HTML COMMENTS! WordPress is commenting out our block:');
            commentMatches.forEach(match => {
                console.error(match.substring(0, 500) + '...');
            });
        }
        
        // Try to extract the containers
        const containerStartIndex = htmlContent.indexOf('<div class="nxt-glossary-container"');
        if (containerStartIndex !== -1) {
            console.log('Found nxt-glossary-container in HTML');
        }
        
        const blockStartIndex = htmlContent.indexOf('<div id="nxt-glossary-block-container"');
        if (blockStartIndex !== -1) {
            console.log('Found nxt-glossary-block-container in HTML');
        }
    } else {
        console.error('Could not find glossary in raw HTML - block might not be rendering at all');
    }
    
    // More thorough debugging to find anything with nxt-glossary
    console.log('Searching for any elements with "nxt-glossary" in their class attribute...');
    document.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
            if (el.className.indexOf('nxt-glossary') !== -1) {
                console.log('Found element with nxt-glossary in class string:', el.className, el);
            }
        } else if (el.classList) {
            const classArray = Array.from(el.classList);
            for (let i = 0; i < classArray.length; i++) {
                if (classArray[i].indexOf('nxt-glossary') !== -1) {
                    console.log('Found element with nxt-glossary in classList:', classArray, el);
                    break;
                }
            }
        }
    });
    
    // Check for elements with our data attributes
    console.log('Searching for elements with our data attributes...');
    document.querySelectorAll('[data-sort-by], [data-sort-order], [data-initial-count]').forEach(el => {
        console.log('Found element with glossary data attributes:', el);
    });
}

class NXTGlossary {
    constructor() {
        console.log('NXTGlossary initialized');
        
        // Configuration
        this.config = {
            useClientSideSearch: true, // Set to false to use AJAX search instead
        };
        
        // Run DOM debugging
        debugDOM();
        
        // First try to find by ID (most reliable)
        const blockById = document.getElementById('nxt-glossary-block-container');
        if (blockById) {
            console.log('Found block by ID:', blockById);
            this.blocks = [blockById];
        } else {
            // Look for both class names that might be used
            const blockBlocks = document.querySelectorAll('.nxt-glossary-block');
            const containerBlocks = document.querySelectorAll('.nxt-glossary-container');
            
            // Combine the two NodeLists into one array
            this.blocks = [...blockBlocks, ...containerBlocks];
            console.log('Found via classes:', { 
                blockClass: blockBlocks.length, 
                containerClass: containerBlocks.length 
            });
        }
        
        console.log('Found blocks:', this.blocks.length);
        
        // Debug: List all elements on the page to help diagnose the issue
        console.log('All divs on page:', document.querySelectorAll('div').length);
        console.log('Elements with .nxt-glossary-block class:', document.querySelectorAll('.nxt-glossary-block').length);
        console.log('Elements with .nxt-glossary-container class:', document.querySelectorAll('.nxt-glossary-container').length);
        
        if (this.blocks.length === 0) {
            console.error('No glossary blocks found on the page. Make sure the block is properly added to the page.');
        } else {
            this.init();
        }
    }

    init() {
        this.blocks.forEach(block => {
            // First try class-specific selectors
            let searchInput = block.querySelector('.nxt-glossary-search-input');
            let loadMoreBtn = block.querySelector('.nxt-glossary-load-more');
            let termsContainer = block.querySelector('.nxt-glossary-terms');
            
            console.log('Block elements:', {
                searchInput: !!searchInput,
                loadMoreBtn: !!loadMoreBtn,
                termsContainer: !!termsContainer
            });

            if (searchInput) {
                this.setupSearch(searchInput, termsContainer, block);
            }

            if (loadMoreBtn) {
                this.setupLoadMore(loadMoreBtn, termsContainer, block);
            }
        });
    }

    setupSearch(input, container, block) {
        let debounceTimer;

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (this.config.useClientSideSearch) {
                    // Simple client-side search (faster, works without server requests)
                    const searchTerm = e.target.value.toLowerCase();
                    const terms = block.querySelectorAll('.nxt-glossary-term');
                    
                    terms.forEach(term => {
                        const title = term.querySelector('.nxt-glossary-term-title').textContent.toLowerCase();
                        const excerpt = term.querySelector('.nxt-glossary-term-excerpt').textContent.toLowerCase();
                        
                        if (title.includes(searchTerm) || excerpt.includes(searchTerm)) {
                            term.style.display = '';
                        } else {
                            term.style.display = 'none';
                        }
                    });
                } else {
                    // AJAX-based search (for more complex search requirements)
                    this.searchTerms(e.target.value, container, block);
                }
            }, 300);
        });
    }

    setupLoadMore(button, container, block) {
        let page = 1;
        const perPage = parseInt(block.dataset.initialCount);
        const sortBy = block.dataset.sortBy;
        const sortOrder = block.dataset.sortOrder;

        button.addEventListener('click', () => {
            page++;
            this.loadMoreTerms(page, perPage, sortBy, sortOrder, container, button);
        });
    }

    async searchTerms(term, container, block) {
        try {
            const formData = new FormData();
            formData.append('action', 'nxt_glossary_search');
            formData.append('nonce', nxtGlossary.nonce);
            formData.append('term', term);
            formData.append('sort_by', block.dataset.sortBy);
            formData.append('sort_order', block.dataset.sortOrder);

            const response = await fetch(nxtGlossary.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.success) {
                this.updateTerms(container, data.data);
            }
        } catch (error) {
            console.error('Error searching terms:', error);
        }
    }

    async loadMoreTerms(page, perPage, sortBy, sortOrder, container, button) {
        try {
            const formData = new FormData();
            formData.append('action', 'nxt_glossary_load_more');
            formData.append('nonce', nxtGlossary.nonce);
            formData.append('page', page);
            formData.append('per_page', perPage);
            formData.append('sort_by', sortBy);
            formData.append('sort_order', sortOrder);

            const response = await fetch(nxtGlossary.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.success) {
                this.appendTerms(container, data.data.terms);
                if (!data.data.has_more) {
                    button.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading more terms:', error);
        }
    }

    updateTerms(container, terms) {
        container.innerHTML = terms.map(term => `
            <div class="nxt-glossary-term" data-id="${term.id}">
                <details class="nxt-glossary-term-details">
                    <summary class="nxt-glossary-term-summary">
                        <h3 class="nxt-glossary-term-title">${this.escapeHtml(term.title)}</h3>
                        <div class="nxt-glossary-term-excerpt">${this.escapeHtml(term.excerpt)}</div>
                    </summary>
                    <div class="nxt-glossary-term-content">${term.content}</div>
                </details>
            </div>
        `).join('');
    }

    appendTerms(container, terms) {
        const html = terms.map(term => `
            <div class="nxt-glossary-term" data-id="${term.id}">
                <details class="nxt-glossary-term-details">
                    <summary class="nxt-glossary-term-summary">
                        <h3 class="nxt-glossary-term-title">${this.escapeHtml(term.title)}</h3>
                        <div class="nxt-glossary-term-excerpt">${this.escapeHtml(term.excerpt)}</div>
                    </summary>
                    <div class="nxt-glossary-term-content">${term.content}</div>
                </details>
            </div>
        `).join('');
        container.insertAdjacentHTML('beforeend', html);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize when DOM is ready or when the block is injected
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // Create an instance when the document is loaded (default behavior)
    setTimeout(() => {
        console.log('Running with delay to ensure complete rendering');
        new NXTGlossary();
    }, 500);
});

// Listen for our custom event that signals the block was injected
document.addEventListener('nxt-glossary-block-ready', () => {
    console.log('NXT Glossary: Block was injected via script, reinitializing');
    new NXTGlossary();
}); 