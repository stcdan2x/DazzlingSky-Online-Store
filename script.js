const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "dxiopi40liwa",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "iGhTpR2RDNMlW_uo9SEec15D6vzh_GMZwkM965L2Y-g"
});

const cartBtn = document.querySelector(".cart__btn"),
      closeCartBtn = document.querySelector(".close-cart"),
      clearCartBtn = document.querySelector(".clear-cart"),
      cartBlock = document.querySelector(".cart"),
      cartOverlay = document.querySelector(".cart-overlay"),
      cartCounter = document.querySelector(".cart__counter"),
      cartTotal = document.querySelector(".cart-total"),
      cartContent = document.querySelector(".cart-content"),
      productsMain = document.querySelector(".products__main"),
      prevBtn = document.querySelector(".banner__prev-btn"),
      nextBtn = document.querySelector(".banner__next-btn"),
      bannerSlider = document.querySelector(".banner__slider");
      
let slides = document.querySelectorAll(".banner__slide"),
    slideSelectors = document.querySelectorAll(".banner__selector-btn"),
    cart = [],
    buttonsDOM = [];

slides = [...slides];
slideSelectors = [...slideSelectors];

window.addEventListener("load", () => {
    const   present = new Present();
    const   titleBar = document.querySelector(".title"),
            promoBar = document.querySelector(".promo"),
            promoLeft = document.querySelector(".promo__text--left"),
            promoRight = document.querySelector(".promo__text--right");
    //for initial banner animation
    const   insTitleBar = () => titleBar.style.transform = "translate(0)",
            insPromoBar = () => promoBar.style.transform = "translate(0)",
            dropLeft = () => promoLeft.style.transform = "translate(0)",
            dropRight = () => promoRight.style.transform = "translate(0)";
    setTimeout(insTitleBar, 100);
    setTimeout(insPromoBar, 800);
    setTimeout(dropLeft, 1200);
    setTimeout(dropRight, 1700);

    const slideCount = slides.length;
    let index = 0;
    nextBtn.addEventListener("click", () => {
        present.removeActive();
        index++;
        if(index > (slideCount - 1)) {
            index = 0;
        }
        present.addActive(index);
    });
    prevBtn.addEventListener("click", () => {
        present.removeActive();
        index--;
        if(index < 0) {
            index = (slideCount - 1);
        }
        present.addActive(index);
    });

    slideSelectors.forEach((selector, index) => {
        selector.addEventListener("click", () => {
            present.removeActive();
            present.addActive(index);
        });
    });

    let setAuto;
    const slideAuto = () => {
        setAuto = setInterval(() => {
            present.removeActive();
            index++;
            if(index > (slideCount - 1)) {
            index = 0;
            }
            present.addActive(index);
        }, 4000);
    }
    slideAuto();

    bannerSlider.addEventListener("mouseover", () => {
        clearInterval(setAuto);
        setAuto = 0;
    })

    bannerSlider.addEventListener("mouseout", () => {
        slideAuto();
    })
});


//access products data
class Products{
    async getProducts() {
        try {

            const contentful = await client.getEntries({
                content_type: "dsosProducts"
              });

            /* let result = await fetch("products.json");
            let data = await result.json(); */
            let products = contentful.items;
            products = products.map(item => {
                const {title,price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title,price,id,image};
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

//display products
class UI{

    displayProducts(products) {
        let result = "";
        products.forEach(product => {
            result += `
            <article class="product">
                <div class="img-container">
                    <img src="${product.image}" alt="product for sale" class="product-img">
                    <button class="addcart-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$ ${product.price}</h4>
            </article>
            `;            
        });
        productsMain.innerHTML = result;
    }
    
    getCartButtons() {
        const buttons = [...document.querySelectorAll(".addcart-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            const id = button.dataset.id;
            let inCart = cart.find(cartElem => cartElem.id === id);
            if(inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener("click", (event) => {
                event.target.disabled = true;
                event.target.innerText = "In Cart";
                // get the specific product from products in local storage (or web server) by dataset id and add a property of amount:1.
                let cartItem = {...Storage.getProduct(id), amount: 1};   
                // add the product's data captured by cartItem into cart array cart[]
                cart = [...cart, cartItem];
                //save cart's current captured state to local storage (or web server)
                Storage.cartSaveState(cart);
                //set updated cart values and display it on cart window
                this.setCartValues(cart);
                //display every cart item on cart window
                this.addCartItem(cartItem);
                //reveal cart window by adding transparentbcg and showcart classes
                this.showCart();
            });
        })
    }

    setCartValues(cart) {
        let tempPriceTotal = 0; //total price of all items in cart (.cart-total)
        let itemsTotal = 0; //total number of items in cart (.cart__counter)
        cart.map( cartElem => {
            tempPriceTotal += cartElem.price * cartElem.amount;
            itemsTotal += cartElem.amount})
        cartTotal.innerText = parseFloat(tempPriceTotal.toFixed(2));
        cartCounter.innerText = itemsTotal;
    }

    addCartItem(cartItem) {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src="${cartItem.image}" alt="product">
            <div>
                <h4>${cartItem.title}</h4>
                <h5>$ ${cartItem.price}</h5>
                <span class="remove-item" data-id=${cartItem.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${cartItem.id}></i>
                <p class="item-amount">${cartItem.amount}</p>
                <i class="fas fa-chevron-down" data-id=${cartItem.id}></i>
            </div> 
        `;
        cartContent.appendChild(div);
    }

    showCart() {
        cartBlock.classList.add("showcart");
        cartOverlay.classList.add("tinted");
    }

    hideCart() {
        cartBlock.classList.remove("showcart");
        cartOverlay.classList.remove("tinted");
    }

    //setup the cart to restore its state if the window gets refreshed, etc.
    restoreCart() {
        //check if the cart in the source local storage/web server is empty or not
        //if source cart is empty, return empty, if cart is not empty, retrieve it
        cart = Storage.getCart();
        //update the values of the cart app and navbar cart icon, in case it is not empty
        this.setCartValues(cart);
        //populate the cart app by using data retrieved from source and adding it to the DOM
        this.populateCart(cart);
        closeCartBtn.addEventListener("click", this.hideCart);
        /* cartOverlay.addEventListener("click", this.hideCart); */
        cartBtn.addEventListener("click", this.showCart);
    }

    populateCart(cart) {
        cart.forEach(cartElem => this.addCartItem(cartElem));
    }

    cartLogic() {
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });
        //add an event listener for clicks on remove and add/subtract functionality
        cartContent.addEventListener("click", event => {
            if(event.target.classList.contains("remove-item")) {
                cartContent.removeChild(event.target.parentElement.parentElement);
                let id = event.target.dataset.id;
                this.removeItem(id);
            } else if(event.target.classList.contains("fa-chevron-up")) {
                let id = event.target.dataset.id;
                let tempItem = cart.find(cartElem => cartElem.id === id);
                //add +1 to the amount for every click
                tempItem.amount += 1;
                //save cart state to local storage/web server
                Storage.cartSaveState(cart);
                //update cart values in the cart window
                this.setCartValues(cart);
                //update the amount displayed between chevrons in the cart window
                event.target.nextElementSibling.innerText = tempItem.amount;
            } else if(event.target.classList.contains("fa-chevron-down")) {
                let id = event.target.dataset.id;
                let tempItem = cart.find(cartElem => cartElem.id === id);
                //deduct 1 to the amount for every click
                tempItem.amount -= 1;
                if(tempItem.amount > 0) {
                    //if item is more than 0, save cart state to local storage/web server
                    Storage.cartSaveState(cart);
                    //if item is more than 0, update cart values in the cart window
                    this.setCartValues(cart);
                    //if item is more than 0, update the amount displayed between chevrons in the cart window
                    event.target.previousElementSibling.innerText = tempItem.amount;
                } else {
                    //if item amount is 0, remove item from the DOM
                    cartContent.removeChild(event.target.parentElement.parentElement);
                    //if item is 0, remove item from cart array and local storage/web server
                    this.removeItem(id);
                }
            }
        })
    }

    clearCart(id) {
        // get the id of all items in the cart
        let cartItemIds = cart.map(cartElem => cartElem.id);
        //filter out each item to remove them one by one from cart array
        cartItemIds.forEach(id => this.removeItem(id));
        //remove cart items from cart DOM
        while(cartContent.children.length > 0){
            cartContent.removeChild(cartContent.children[0]);
        }
    }
    
    removeItem(id) {
        //filter out each item to remove them one by one from cart array
        cart = cart.filter( item => item.id !== id);
        //update cart window values after removing items from cart
        this.setCartValues(cart);
        //update the cart's values in local storage
        Storage.cartSaveState(cart);
        //access addcart button and restore button state to add cart after removing item from cart
        let button = this.getButton(id);
        //enable back the addcart button and icon
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i> add to cart`;
    }
    
    getButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }


}

//local storage
class Storage{
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find(product => product.id === id);

    }

    static cartSaveState(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    }
}

//Styles and Presentation
class Present {
    removeActive = () => {
        for (let slide of slides) {
            slide.classList.remove("active");
        }
        for (let slideSelector of slideSelectors) {
            slideSelector.classList.remove("active");
        }
    }

    addActive = index => {
        slides[index].classList.add("active");
        slideSelectors[index].classList.add("active");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    ui.restoreCart();
    //get all products from data source
    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then( () => {
        ui.getCartButtons();
        ui.cartLogic();
    });
});
