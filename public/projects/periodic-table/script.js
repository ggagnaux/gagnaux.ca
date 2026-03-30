// Constants
const MAX_CIRCLES = 50;

// Global variables
let circles = [];

// P5.js setup function
function setup() {
    createCanvas(windowWidth, windowHeight);
    initCircles();
}

// P5.js draw function
function draw() {
    background(6, 6, 35);
    for (let circle of circles) {
        circle.move();
        circle.display();
    }

    // Draw lines between circles
    for (let i = 0; i < circles.length; i++) {
        for (let j = 0; j < circles.length; j++) {
            if (i !== j && dist(circles[i].x, circles[i].y, circles[j].x, circles[j].y) < 250) {
                line(circles[i].x, circles[i].y, circles[j].x, circles[j].y);
            }
        }
    }
}

// P5.js window resize function
function windowResized() {
    initCircles();
    resizeCanvas(windowWidth, windowHeight);
}

// Initialize circles
function initCircles() {
    circles = [];
    for (let i = 0; i < MAX_CIRCLES; i++) {
        circles.push(new Circle(random(width), random(height)));
    }
}

// Circle class
class Circle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.diameter = random(2, 70);

        let speedX = random(-.2, .2);
        let speedY = random(-.2, .2);
        this.speedX = speedX;
        this.speedY = speedY;
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) {
            this.speedX *= -1;
        }

        if (this.y < 0 || this.y > height) {
            this.speedY *= -1;
        }
    }

    display() {
        stroke(60);
        fill(10, 10, 40);
        ellipse(this.x, this.y, this.diameter, this.diameter);
    }
}

// Event handlers
function setupEventHandlers() {
    // Close button event listener
    document.getElementById('close-button').addEventListener('click', function() {
        document.getElementById('viewport-overlay').style.display = 'none';
        document.getElementById('new-div').style.display = 'none';
    });        

    // Element click event listeners
    document.querySelectorAll('.element').forEach(function(element) {
        element.addEventListener('click', function() {
            // Get element data
            const symbol = this.dataset.symbol;
            const elementName = this.querySelector('.element-name').textContent;
            const atomicNumber = this.querySelector('.atomic-number').textContent;
            
            // Update modal title
            document.getElementById('detail-title').textContent = `${symbol} - ${elementName}`;
            
            // Update iframe with Wikipedia page for the element
            const iframe = document.querySelector('#new-div iframe');
            iframe.src = `https://en.wikipedia.org/wiki/${elementName}`;
            
            // Show modal
            document.getElementById('viewport-overlay').style.display = 'block';
            document.getElementById('new-div').style.display = 'block';
        });
    });
}

// Canvas loading function (currently unused)
function loadCanvas(id) {
    var canvas = document.createElement('canvas'),
    div = document.getElementById(id);

    var positionInfo = div.getBoundingClientRect();
    var height = positionInfo.height;
    var width = positionInfo.width;

    canvas.id     = "canvGameStage";
    canvas.width  = width;
    canvas.height = height;
    canvas.style.zIndex   = 8;
    canvas.style.position = "absolute";
    canvas.style.border   = "5px solid";
    div.appendChild(canvas);
}

// jQuery document ready function
$(document).ready(function() {
    // Setup event handlers
    setupEventHandlers();

    // Element categories for hover effects
    let Categories = [
        'alkali-metal', 'alkali-earth', 'transition-metal', 'basic-metal', 
        'semimetal', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide'
    ];

    let currentCategory = '';

    // Element hover effects
    $('.element').hover(
        function() {
            // Get the current element category
            let elementClasses = $(this).attr("class").split(/\s+/);
            Categories.forEach(function (s) {
                if (elementClasses.includes(s)) {
                    currentCategory = s;
                }
            });

            // Get the current category class and store it for later
            $(this).removeClass(currentCategory);

            // Add the hovered class
            $(this).addClass('hovered');
        }, 
        function() {
            // Add the previous category back 
            $(this).addClass(currentCategory);

            // Remove the 'hovered' class
            $(this).removeClass('hovered');
        }
    );
});
