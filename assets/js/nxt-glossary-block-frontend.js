document.addEventListener('DOMContentLoaded', function() {
    console.log('NXT Glossary: Script loaded');
    
    // Find all glossary blocks
    const glossaryBlocks = document.querySelectorAll('.nxt-glossary-container, #nxt-glossary-block-container');
    
    if (glossaryBlocks.length === 0) {
        console.log('NXT Glossary: No blocks found on page');
        return;
    }
    
    console.log(`NXT Glossary: Found ${glossaryBlocks.length} blocks`);
    
    // Initialize each block
    glossaryBlocks.forEach(block => {
        initGlossaryBlock(block);
    });
    
    function initGlossaryBlock(block) {
        const searchInput = block.querySelector('.nxt-glossary-search-input');
        const loadMoreBtn = block.querySelector('.nxt-glossary-load-more');
        const termsContainer = block.querySelector('.nxt-glossary-terms');
        
        // Setup search functionality
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
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
                }, 300);
            });
        }
        
        // Setup load more functionality
        if (loadMoreBtn && termsContainer) {
            let page = 1;
            const initialCount = parseInt(block.dataset.initialCount) || 10;
            const sortBy = block.dataset.sortBy || 'title';
            const sortOrder = block.dataset.sortOrder || 'asc';
            
            loadMoreBtn.addEventListener('click', function() {
                page++;
                loadMoreTerms(page, initialCount, sortBy, sortOrder, termsContainer, loadMoreBtn);
            });
        }
    }
    
    // Function to load more terms via AJAX
    function loadMoreTerms(page, perPage, sortBy, sortOrder, container, button) {
        button.disabled = true;
        button.textContent = 'Loading...';
        
        const formData = new FormData();
        formData.append('action', 'nxt_glossary_load_more');
        formData.append('nonce', nxtGlossary.nonce);
        formData.append('page', page);
        formData.append('per_page', perPage);
        formData.append('sort_by', sortBy);
        formData.append('sort_order', sortOrder);
        
        fetch(nxtGlossary.ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Append new terms to the container
                const termsHtml = data.data.terms.map(term => `
                    <div class="nxt-glossary-term">
                        <details>
                            <summary>
                                <h3 class="nxt-glossary-term-title">${escapeHtml(term.title)}</h3>
                                <div class="nxt-glossary-term-excerpt">${escapeHtml(term.excerpt)}</div>
                            </summary>
                            <div class="nxt-glossary-term-content">${term.content}</div>
                        </details>
                    </div>
                `).join('');
                
                container.insertAdjacentHTML('beforeend', termsHtml);
                
                // Hide button if no more terms
                if (!data.data.has_more) {
                    button.style.display = 'none';
                } else {
                    button.disabled = false;
                    button.textContent = 'Load More Terms';
                }
            }
        })
        .catch(error => {
            console.error('Error loading more terms:', error);
            button.disabled = false;
            button.textContent = 'Try Again';
        });
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
