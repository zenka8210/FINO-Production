(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_app_4405e992._.js", {

"[project]/src/app/cart/cart.module.css [app-client] (css module)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.v({
  "cartItem": "cart-module__-RJi4G__cartItem",
  "checkoutBtn": "cart-module__-RJi4G__checkoutBtn",
  "container": "cart-module__-RJi4G__container",
  "itemActions": "cart-module__-RJi4G__itemActions",
  "itemImage": "cart-module__-RJi4G__itemImage",
  "itemInfo": "cart-module__-RJi4G__itemInfo",
  "quantityControl": "cart-module__-RJi4G__quantityControl",
  "removeBtn": "cart-module__-RJi4G__removeBtn",
  "total": "cart-module__-RJi4G__total",
});
}}),
"[project]/src/app/component/CartList.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>CartList)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/cart/cart.module.css [app-client] (css module)");
'use client';
;
;
function CartList({ items, onIncrease, onDecrease, onRemove }) {
    if (items.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: "Giỏ hàng trống"
        }, void 0, false, {
            fileName: "[project]/src/app/component/CartList.tsx",
            lineNumber: 21,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cartList,
        children: items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cartItem,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: item.image,
                        alt: item.name,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].itemImage,
                        onError: (e)=>{
                            const target = e.target;
                            target.src = '/fallback.jpg';
                            target.alt = 'Hình ảnh không khả dụng';
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/app/component/CartList.tsx",
                        lineNumber: 28,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].itemInfo,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: item.name
                            }, void 0, false, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 40,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Giá: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            item.price.toLocaleString('vi-VN'),
                                            " VNĐ"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 41,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 41,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Số lượng: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: item.quantity
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 42,
                                        columnNumber: 38
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 42,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Tổng: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            (item.price * item.quantity).toLocaleString('vi-VN'),
                                            " VNĐ"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 43,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 43,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/component/CartList.tsx",
                        lineNumber: 39,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].itemActions,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].quantityControl,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onDecrease(item.id),
                                        children: "-"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 48,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: item.quantity
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 49,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>onIncrease(item.id),
                                        children: "+"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/component/CartList.tsx",
                                        lineNumber: 50,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 47,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].removeBtn,
                                onClick: ()=>onRemove(item.id),
                                children: "X"
                            }, void 0, false, {
                                fileName: "[project]/src/app/component/CartList.tsx",
                                lineNumber: 52,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/component/CartList.tsx",
                        lineNumber: 46,
                        columnNumber: 21
                    }, this)
                ]
            }, item.id, true, {
                fileName: "[project]/src/app/component/CartList.tsx",
                lineNumber: 27,
                columnNumber: 17
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/app/component/CartList.tsx",
        lineNumber: 25,
        columnNumber: 9
    }, this);
}
_c = CartList;
var _c;
__turbopack_context__.k.register(_c, "CartList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/cart/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>CartPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$component$2f$CartList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/component/CartList.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/app/cart/cart.module.css [app-client] (css module)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const initialState = {
    items: [],
    total: 0
};
function calculateTotal(items) {
    return items.reduce((acc, item)=>acc + item.price * item.quantity, 0);
}
function saveToStorage(items) {
    localStorage.setItem('cart', JSON.stringify(items));
}
function cartReducer(state, action) {
    let updatedItems = [];
    switch(action.type){
        case 'LOAD_CART':
            return {
                items: action.payload,
                total: calculateTotal(action.payload)
            };
        case 'INCREASE':
            updatedItems = state.items.map((item)=>item.id === action.id ? {
                    ...item,
                    quantity: item.quantity + 1
                } : item);
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems)
            };
        case 'DECREASE':
            updatedItems = state.items.map((item)=>item.id === action.id && item.quantity > 1 ? {
                    ...item,
                    quantity: item.quantity - 1
                } : item);
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems)
            };
        case 'REMOVE':
            updatedItems = state.items.filter((item)=>item.id !== action.id);
            saveToStorage(updatedItems);
            return {
                items: updatedItems,
                total: calculateTotal(updatedItems)
            };
        case 'CHECKOUT':
            localStorage.removeItem('cart');
            return {
                items: [],
                total: 0
            };
        default:
            return state;
    }
}
function CartPage() {
    _s();
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducer"])(cartReducer, initialState);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CartPage.useEffect": ()=>{
            const storedItems = JSON.parse(localStorage.getItem('cart') || '[]');
            dispatch({
                type: 'LOAD_CART',
                payload: storedItems
            });
            const handleStorage = {
                "CartPage.useEffect.handleStorage": ()=>{
                    const updated = JSON.parse(localStorage.getItem('cart') || '[]');
                    dispatch({
                        type: 'LOAD_CART',
                        payload: updated
                    });
                }
            }["CartPage.useEffect.handleStorage"];
            window.addEventListener('storage', handleStorage);
            return ({
                "CartPage.useEffect": ()=>window.removeEventListener('storage', handleStorage)
            })["CartPage.useEffect"];
        }
    }["CartPage.useEffect"], []);
    const handleIncrease = (id)=>dispatch({
            type: 'INCREASE',
            id
        });
    const handleDecrease = (id)=>dispatch({
            type: 'DECREASE',
            id
        });
    const handleRemove = (id)=>dispatch({
            type: 'REMOVE',
            id
        });
    const handleCheckout = ()=>{
    // const confirmed = window.confirm('Bạn có chắc chắn muốn thanh toán không?');
    // if (confirmed) {
    //     dispatch({ type: 'CHECKOUT' });
    //     alert('Đặt hàng thành công! 🎉');
    // }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].cartPage,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "Giỏ hàng của bạn"
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 117,
                columnNumber: 13
            }, this),
            state.items.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Giỏ hàng đang trống."
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 119,
                columnNumber: 17
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$component$2f$CartList$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        items: state.items,
                        onIncrease: handleIncrease,
                        onDecrease: handleDecrease,
                        onRemove: handleRemove
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 122,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].total,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: [
                                    "Tổng tiền: ",
                                    state.total.toLocaleString('vi-VN'),
                                    " VNĐ"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/cart/page.tsx",
                                lineNumber: 129,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$cart$2f$cart$2e$module$2e$css__$5b$app$2d$client$5d$__$28$css__module$29$__["default"].checkoutBtn,
                                onClick: handleCheckout,
                                children: "Thanh toán"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cart/page.tsx",
                                lineNumber: 130,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 128,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/cart/page.tsx",
        lineNumber: 116,
        columnNumber: 9
    }, this);
}
_s(CartPage, "bgCdjuTOmPdSBRwTap80EFd9Y3U=");
_c = CartPage;
var _c;
__turbopack_context__.k.register(_c, "CartPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_app_4405e992._.js.map