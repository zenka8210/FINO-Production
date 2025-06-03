(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_app_cart_page_tsx_4788d5c2._.js", {

"[project]/src/app/cart/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({});
'use client';
const initialState = {
    items: [],
    total: 0
};
const cartReducer = (state, action)=>{
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
};
const calculateTotal = (items)=>{
    return items.reduce((acc, item)=>acc + item.price * item.quantity, 0);
};
const saveToStorage = (items)=>{
    localStorage.setItem('cart', JSON.stringify(items));
};
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_app_cart_page_tsx_4788d5c2._.js.map