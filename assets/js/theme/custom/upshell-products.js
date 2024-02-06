import $ from 'jquery';
import graphql from "../common/graph-ql";
import { async } from "regenerator-runtime";
import modalFactory from "../global/modal";

let selectedAddOns = [];
let previewModalOppener = modalFactory("#previewModal")[0];
let $form = $("form[data-cart-item-add]");

const priceUpdate = (currentPrice) => {
  let price = 0;
  document
    .querySelectorAll(".productView-info-value.test1 input:checked")
    .forEach((ele) => {
      price += Number(ele.getAttribute("data-price"));
    });

  if (currentPrice.includes("-")) {
    if (price) {
      return `${currentPrice} +(${price})`;
    }
    return currentPrice;
  } else {
    // Convert price to a string before using match and replace
    let priceString = currentPrice.toString();

    // Extracting the currency symbol
    let currencySymbol = priceString.match(/[^\d.]/)[0];

    // Extracting the numerical value
    let numericalValue = parseFloat(priceString.replace(/[^\d.]/g, ""));

    return `${currencySymbol}${price + numericalValue}`;
  }
};

const upshellProducts = (context) => {
  const productList = document.querySelector("[data-ids]")
    ? document.querySelector("[data-ids]")
    : "";
  if (productList) {
    let upshellProducts = JSON.parse(productList.dataset.ids);

    function queryString(list) {
      const query = `query SeveralProductsByID {
          site {
            products(first: 50, entityIds: [${list}]) {
              edges {
                node {
                  entityId
                  name
                  sku
                  prices {
                    price {
                      ...MoneyFields
                    }
                  }
                }
              }
            }
          }
        }
        fragment MoneyFields on Money {
            value
            currencyCode
          }`;
      return query;
    }

    if (upshellProducts.length) {
      graphql(context.authorization, queryString(upshellProducts), (result) => {
        result.then((json) => {
          let products = json.data.site.products.edges;
          createUpshellProducts(products);
        });
      });
    }

    function createUpshellProducts(products) {
      const container = productList;
      products.forEach((product) => {
        container.appendChild(createCheckbox(product));
      });
      addSelection();
    }
  }
};

function createCheckbox(product) {
  const mainDiv = document.createElement("div");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = product.node.sku;
  checkbox.id = product.node.entityId;
  checkbox.setAttribute("data-price", product.node.prices.price.value);

  const label = document.createElement("label");
  label.htmlFor = checkbox.id;

  // Use innerHTML to set the HTML content of the label
  label.innerHTML = `${product.node.name} - <b>${product.node.prices.price.currencyCode}${product.node.prices.price.value}</b>`;

  mainDiv.appendChild(checkbox);
  mainDiv.appendChild(label);

  return mainDiv;
}

async function upshellProductsSumbit() {
  if (selectedAddOns.length && $form[0].checkValidity()) {
    previewModalOppener.open();
    for (const item of selectedAddOns) {
      // Extracting the key and value from the object
      var productSku = Object.keys(item)[0];
      var postData = item[productSku];

      await new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `/cart.php?${postData}`);
        xhr.onload = function () {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject();
          }
        };
        xhr.send();
      });
    }
    document.querySelector("#form-action-addToCart").click();
  } else {
    document.querySelector("#form-action-addToCart").click();
  }
}

function addSelection() {
  document
    .querySelector("#form-action-addToCart-custom")
    .addEventListener("click", () => {
      upshellProductsSumbit();
    });

  document
    .querySelectorAll(".productView-info-value.test1 input")
    .forEach((ele) => {
      ele.addEventListener("change", () => {
        if (ele.checked) {
          selectedAddOns.push({ [ele.value]: `action=add&sku=${ele.value}` });
          let actualPrice = String(
            $("[data-product-price-without-tax]").data("actual")
          );
          $("[data-product-price-without-tax]").html(priceUpdate(actualPrice));
        } else {
          selectedAddOns = selectedAddOns.filter(
            (item) => Object.keys(item)[0] !== ele.value
          );
          let actualPrice = String(
            $("[data-product-price-without-tax]").data("actual")
          );
          $("[data-product-price-without-tax]").html(priceUpdate(actualPrice));
        }
      });
    });
}

export { upshellProducts, priceUpdate };
