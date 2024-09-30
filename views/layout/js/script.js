document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('#blogCarousel');
    if (!carousel) return; // Exit if carousel doesn't exist

    const carouselInner = carousel.querySelector('.carousel-inner');
    if (!carouselInner) return; // Exit if carousel inner doesn't exist

    const items = carousel.querySelectorAll('.carousel-item');
    if (items.length === 0) return; // Exit if no items

    const prevButton = carousel.querySelector('.carousel-control-prev');
    const nextButton = carousel.querySelector('.carousel-control-next');

    let currentIndex = 0;
    
    function showItem(index) {
        // Implement looping
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        // Hide all items
        items.forEach(item => {
            item.style.display = 'none';
            item.classList.remove('active');
        });
        
        // Show and activate the current item
        items[index].style.display = 'block';
        items[index].classList.add('active');
        
        currentIndex = index;
    }

    // Event listeners for prev and next buttons
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            showItem(currentIndex - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            showItem(currentIndex + 1);
        });
    }

    // Initialize the first item
    showItem(0);

    // Read More button functionality
    const readMoreButtons = document.querySelectorAll('.read-more-btn');
    readMoreButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const blogId = this.getAttribute('data-blog-id');
            
            this.innerHTML = 'Loading...';
            this.disabled = true;
            
            setTimeout(() => {
                window.location.href = `/blogDetails/${blogId}`;
            }, 300);
        });
    });
});



document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll(".nav-link");
    const currentPath = window.location.pathname;

    // Function to update active class
    function updateActiveLink() {
        navLinks.forEach(link => {
            if (link.getAttribute("href") === currentPath) {
                link.classList.add("custom-active");
            } else {
                link.classList.remove("custom-active");
            }
        });
    }

    // Set initial active link
    updateActiveLink();

    // Add click event to update the active link dynamically
    navLinks.forEach(link => {
        link.addEventListener("click", function() {
            navLinks.forEach(link => link.classList.remove("custom-active"));
            this.classList.add("custom-active");
        });
    });
});

function toggleDropdown(className) {
    const elements = document.querySelectorAll(`.${className}`);
    elements.forEach(element => {
        element.classList.toggle('active');
    });
}





document.addEventListener('DOMContentLoaded', function() {
    const blogTypeRadios = document.querySelectorAll('input[name="blogType"]');
    const recipeFields = document.getElementById('recipeFields');
    const contentLabel = document.querySelector('label[for="content"]');
    const contentField = document.getElementById('content');
    const methodField = document.getElementById('method');
    const methodContainer = document.getElementById('methodContainer');
    const form = document.getElementById('blog-form');

    function toggleFields(isRecipe) {
        if (isRecipe) {
            recipeFields.style.display = 'block';
            contentLabel.textContent = 'Ingredients:';
            contentField.placeholder = 'List the ingredients here...';
            methodContainer.style.display = 'block';
        } else {
            recipeFields.style.display = 'none';
            contentLabel.textContent = 'Blog Content:';
            contentField.placeholder = 'Write your blog content here...';
            methodContainer.style.display = 'none';
        }
    }

    // Set initial state
    const initialBlogType = document.querySelector('input[name="blogType"]:checked');
    if (initialBlogType) {
        toggleFields(initialBlogType.value === 'recipe');
    }

    blogTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleFields(this.value === 'recipe');
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting immediately

        const blogType = document.querySelector('input[name="blogType"]:checked').value;
        
        if (blogType === 'recipe') {
            if (contentField.value.trim() === '' || methodField.value.trim() === '') {
                alert('Please enter both ingredients and method for your recipe.');
                return;
            }
        } else {
            if (contentField.value.trim() === '') {
                alert('Please enter content for your blog post.');
                return;
            }
        }

        // If all required fields are populated, submit the form
        this.submit();
    });
});

gsap.registerPlugin(SplitText);

var tl = gsap.timeline(),
  mySplitText = new SplitText("#quote", { type: "words,chars" }),
  chars = mySplitText.chars; //an array of all the divs that wrap each character

gsap.set("#quote", { perspective: 400 });

console.log(chars);

tl.from(chars, {
  duration: 0.8,
  opacity: 0,
  scale: 0,
  y: 80,
  rotationX: 180,
  transformOrigin: "0% 50% -50",
  ease: "back",
  stagger: 0.01
});

document.getElementById("animate").onclick = function () {
  tl.restart();
};
