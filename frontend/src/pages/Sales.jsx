import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle2, DollarSign, CreditCard, Smartphone, ArrowRight, Receipt, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Sales = ({ isKiosk = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState({ efectivo: 0, debito: 0, credito: 0, transferencia: 0, mercadopago: 0, mp_transferencia: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTransferInfo, setShowTransferInfo] = useState(null); // 'bank' or 'mp'
    const [paymentNote, setPaymentNote] = useState('');
    const searchInputRef = useRef(null);

    const BANK_DETAILS = {
        alias: "KIOSCO.VENTAS.2024",
        cbu: "0000003100012345678901",
        titular: "Juan Pérez - Kiosco App"
    };

    const MP_DETAILS = {
        alias: "PAGO.KIOSCO.MP",
        cvu: "0000003100098765432109",
        titular: "Mercado Pago - Kiosco App"
    };

    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e) => {
            const currentTime = Date.now();

            // Typical scanner speed is < 50ms between characters
            if (currentTime - lastKeyTime > 100) {
                barcodeBuffer = '';
            }

            if (e.key === 'Enter') {
                if (barcodeBuffer.length > 3) {
                    const product = products.find(p => p.barcode === barcodeBuffer);
                    if (product) {
                        addToCart(product);
                        setSearchTerm('');
                        // If it was a scan, we prevent the Enter from submitting any form or triggering other clicks
                        e.preventDefault();
                    }
                    barcodeBuffer = '';
                }
            } else if (e.key.length === 1) { // Only capture printable characters
                barcodeBuffer += e.key;
            }

            lastKeyTime = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, promRes, catRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/promotions'),
                    api.get('/categories')
                ]);
                setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.products || []));
                setPromotions(promRes.data.promotions);
                setCategories(catRes.data.categories);
            } catch (err) { console.error(err); }
        };
        fetchData();
        searchInputRef.current?.focus();
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    useEffect(() => {
        if (searchTerm.trim().length > 1 && !isKiosk) {
            setSearchResults(products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm))).slice(0, 5));
        } else setSearchResults([]);
    }, [searchTerm, products, isKiosk]);

    const addToCart = (p) => {
        setCart(prev => {
            const ex = prev.find(i => i.id === p.id);
            if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...p, quantity: 1 }];
        });
        setSearchTerm('');
        setSearchResults([]);
        if (!isKiosk) searchInputRef.current?.focus();
    };

    const updateQty = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0.1, i.quantity + d) } : i).filter(i => i.quantity > 0));

    const subtotal = cart.reduce((t, i) => t + (i.price * i.quantity), 0);
    const discounts = cart.reduce((t, i) => {
        const pr = promotions.find(p => p.product_id === i.id || p.category_id === i.category_id);
        return t + (pr ? (i.price * i.quantity * pr.discount_percentage / 100) : 0);
    }, 0);
    const total = subtotal - discounts;
    const paidSoFar = Object.values(paymentMethods).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const balance = total - paidSoFar;

    const quickFinalize = (method) => {
        if (cart.length === 0) return;
        if (method === 'mp_transferencia' || method === 'transferencia') {
            setShowTransferInfo(method === 'mp_transferencia' ? 'mp' : 'bank');
        } else {
            const methods = { efectivo: 0, debito: 0, credito: 0, transferencia: 0, mercadopago: 0, mp_transferencia: 0 };
            methods[method] = total;
            finalizeSaleInternal(methods);
        }
    };

    const splitFinalize = async () => {
        if (Math.abs(balance) > 0.01) {
            Swal.fire({ icon: 'warning', title: 'Saldo incompleto', text: `Debes cubrir el total de $${total.toFixed(2)}` });
            return;
        }
        await finalizeSaleInternal(paymentMethods);
    };

    const printTicket = (saleData) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        const today = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const itemsHtml = cart.map(item => {
            const promo = promotions.find(p => p.product_id === item.id || p.category_id === item.category_id);
            const originalPrice = item.price * item.quantity;
            const discount = promo ? (originalPrice * promo.discount_percentage / 100) : 0;
            return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-family: monospace;">
                    <div style="flex: 1;">${item.name} x ${item.quantity}</div>
                    <div style="font-weight: bold;">$${(originalPrice - discount).toFixed(2)}</div>
                </div>
                ${promo ? `<div style="font-size: 10px; color: #666; font-family: monospace;">(Desc. ${promo.discount_percentage}%)</div>` : ''}
            `;
        }).join('');

        const paymentsHtml = Object.entries(saleData.payment_methods)
            .filter(([, val]) => parseFloat(val) > 0)
            .map(([method, val]) => `<div style="display: flex; justify-content: space-between; font-family: monospace;"><span>${method.toUpperCase()}:</span> <span>$${parseFloat(val).toFixed(2)}</span></div>`)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket #${saleData.ticket_number}</title>
                    <style>
                        @page { margin: 0; }
                        body { font-family: 'Courier New', Courier, monospace; width: 58mm; margin: 0; padding: 10px; font-size: 12px; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .total { font-size: 16px; margin-top: 10px; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="center">
                        <div class="bold" style="font-size: 16px;">MI KIOSCO</div>
                        <div>Gracias por su compra</div>
                    </div>
                    <div class="line"></div>
                    <div style="font-size: 10px; margin-bottom: 10px;">
                        Ticket: #${saleData.ticket_number}<br>
                        Fecha: ${today} - ${time}
                        ${saleData.payment_note ? `<br>Ref: ${saleData.payment_note}` : ''}
                    </div>
                    <div class="line"></div>
                    ${itemsHtml}
                    <div class="line"></div>
                    <div style="display: flex; justify-content: space-between;" class="bold">
                        <span>SUBTOTAL:</span> <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    ${discounts > 0 ? `<div style="display: flex; justify-content: space-between; color: #444;"><span>AHORRO:</span> <span>-$${discounts.toFixed(2)}</span></div>` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 18px;" class="bold">
                        <span>TOTAL:</span> <span>$${total.toFixed(2)}</span>
                    </div>
                    <div class="line"></div>
                    <div class="bold" style="margin-bottom: 5px;">PAGOS:</div>
                    ${paymentsHtml}
                    <div class="line"></div>
                    <div class="center" style="margin-top: 20px; font-size: 10px;">
                        *** DOCUMENTO NO VALIDO COMO FACTURA ***
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const finalizeSaleInternal = async (methods) => {
        setIsProcessing(true);
        try {
            const data = {
                items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, unit_type: i.stock_unit === 'Kg' ? 'kg' : 'unidad', promotion_id: promotions.find(p => p.product_id === i.id || p.category_id === i.category_id)?.id || null })),
                payment_methods: methods,
                payment_note: paymentNote
            };
            const res = await api.post('/sales', data);

            printTicket({ ...res.data.sale, payment_methods: methods, payment_note: paymentNote });

            Swal.fire({
                icon: 'success',
                title: '¡Cobro Exitoso!',
                text: `Ticket: ${res.data.sale.ticket_number}`,
                showCancelButton: true,
                confirmButtonText: 'Imprimir otra vez',
                cancelButtonText: 'Cerrar',
                customClass: { popup: 'rounded-[32px]' }
            }).then((result) => {
                if (result.isConfirmed) {
                    printTicket({ ...res.data.sale, payment_methods: methods, payment_note: paymentNote });
                }
            });

            setCart([]);
            setIsSplitPayment(false);
            setPaymentMethods({ efectivo: 0, debito: 0, credito: 0, transferencia: 0, mercadopago: 0, mp_transferencia: 0 });
            setPaymentNote('');
            if (!isKiosk) searchInputRef.current?.focus();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo realizar la venta' });
        } finally { setIsProcessing(false); }
    };

    if (isKiosk) {
        return (
            <div className="fixed inset-0 bg-[#0f172a] text-white overflow-hidden flex flex-col font-sans">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

                <header className="relative z-10 flex items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
                            <Receipt size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter">KIOSCO <span className="text-blue-400">POS</span></h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium Standalone Mode</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-12 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            ref={searchInputRef}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                            placeholder="Buscar producto por nombre o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button onClick={() => window.close()} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-white/10 group">
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </header>

                <main className="relative z-10 flex-1 flex gap-8 p-8 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-blue-600 shadow-lg shadow-blue-500/40 text-white' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id.toString())}
                                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat.id.toString() ? 'bg-blue-600 shadow-lg shadow-blue-500/40 text-white' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="group relative bg-white/5 border border-white/5 rounded-[32px] p-6 text-left hover:bg-white/10 transition-all hover:-translate-y-1 active:scale-95 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 font-black mb-4 uppercase">
                                            {p.name.charAt(0)}
                                        </div>
                                        <h3 className="font-bold text-lg line-clamp-2 leading-tight h-12">{p.name}</h3>
                                        <div className="flex items-end justify-between">
                                            <p className="text-2xl font-black text-blue-400">${p.price}</p>
                                            <Plus size={24} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-[450px] bg-white text-gray-900 rounded-[48px] shadow-2xl flex flex-col overflow-hidden border border-white/20">
                        <div className="p-8 pb-4 flex items-center justify-between border-b">
                            <h2 className="text-xl font-black tracking-tight">CARRITO</h2>
                            <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full font-black text-xs">{cart.length} ITEMS</span>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-6 grayscale opacity-50">
                                    <ShoppingCart size={80} />
                                    <p className="font-bold text-center">Selecciona productos para comenzar</p>
                                </div>
                            )}
                            {cart.map(i => (
                                <div key={i.id} className="flex items-center gap-4 py-4 border-b last:border-0 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-gray-800 leading-tight truncate">{i.name}</p>
                                        <p className="text-xs text-gray-400 font-bold">${i.price} / {i.stock_unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border">
                                        <button onClick={() => updateQty(i.id, -1)} className="p-1.5 hover:text-red-500 transition-all"><Minus size={16} /></button>
                                        <span className="w-8 text-center font-black text-gray-800">{i.quantity}</span>
                                        <button onClick={() => updateQty(i.id, 1)} className="p-1.5 hover:text-blue-600 transition-all"><Plus size={16} /></button>
                                    </div>
                                    <div className="text-right ml-2">
                                        <p className="font-black text-gray-800">${(i.price * i.quantity).toFixed(2)}</p>
                                        <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} className="text-[10px] text-red-400 font-black hover:underline uppercase">Quitar</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-gray-50 space-y-6">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                <span>SUBTOTAL</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {discounts > 0.01 && (
                                <div className="flex justify-between items-center text-xs font-black text-emerald-600 italic">
                                    <span>AHORRO APLICADO</span>
                                    <span>-${discounts.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end">
                                <span className="font-black text-gray-400 text-xs mb-2 uppercase">Total a Cobrar</span>
                                <span className="text-5xl font-black text-blue-600 tracking-tighter">${total.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => quickFinalize('efectivo')}
                                    disabled={cart.length === 0 || isProcessing}
                                    className="py-5 bg-[#0f172a] text-white rounded-[28px] font-black shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-widest"
                                >
                                    Efectivo
                                </button>
                                <button
                                    onClick={() => setIsSplitPayment(true)}
                                    disabled={cart.length === 0 || isProcessing}
                                    className="py-5 bg-blue-600 text-white rounded-[28px] font-black shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-widest"
                                >
                                    Otros Pagos
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {isSplitPayment && (
                    <div className="fixed inset-0 z-110 bg-black/80 backdrop-blur-md flex items-center justify-end p-8">
                        <div className="bg-white rounded-[48px] w-full max-w-xl h-full p-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Pago Especial</h2>
                                    <p className="text-gray-400 font-bold">Configura los métodos de pago necesarios</p>
                                </div>
                                <button onClick={() => setIsSplitPayment(false)} className="p-4 bg-gray-100 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                <PayRow label="Efectivo" icon={<DollarSign size={20} />} val={paymentMethods.efectivo} set={v => setPaymentMethods(p => ({ ...p, efectivo: v }))} onFill={() => setPaymentMethods(p => ({ ...p, efectivo: (parseFloat(p.efectivo) || 0) + balance }))} />
                                <PayRow label="Tarjeta Debito" icon={<CreditCard size={20} />} val={paymentMethods.debito} set={v => setPaymentMethods(p => ({ ...p, debito: v }))} onFill={() => setPaymentMethods(p => ({ ...p, debito: (parseFloat(p.debito) || 0) + balance }))} />
                                <PayRow label="Tarjeta Credito" icon={<CreditCard size={20} />} val={paymentMethods.credito} set={v => setPaymentMethods(p => ({ ...p, credito: v }))} onFill={() => setPaymentMethods(p => ({ ...p, credito: (parseFloat(p.credito) || 0) + balance }))} />
                                <PayRow label="Mercado Pago" icon={<Smartphone size={20} />} val={paymentMethods.mercadopago} set={v => setPaymentMethods(p => ({ ...p, mercadopago: v }))} onFill={() => setPaymentMethods(p => ({ ...p, mercadopago: (parseFloat(p.mercadopago) || 0) + balance }))} />
                                <PayRow label="MP Transf." icon={<ArrowRight size={20} />} val={paymentMethods.mp_transferencia} set={v => setPaymentMethods(p => ({ ...p, mp_transferencia: v }))} onFill={() => setPaymentMethods(p => ({ ...p, mp_transferencia: (parseFloat(p.mp_transferencia) || 0) + balance }))} />
                                <PayRow label="Transferencia" icon={<ArrowRight size={20} />} val={paymentMethods.transferencia} set={v => setPaymentMethods(p => ({ ...p, transferencia: v }))} onFill={() => setPaymentMethods(p => ({ ...p, transferencia: (parseFloat(p.transferencia) || 0) + balance }))} />
                            </div>

                            <div className="mt-8 space-y-6 pt-6 border-t">
                                <div className={`p-6 rounded-[32px] flex justify-between items-center font-black text-xl ${balance <= 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                    <span>{balance <= 0.01 ? 'SALDO CUBIERTO' : 'RESTA COBRAR'}</span>
                                    <span>${Math.abs(balance).toFixed(2)}</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Nota de Pago (Opcional)</p>
                                    <input type="text" className="w-full bg-white border border-gray-300 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Ej: Número de operación..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                                </div>
                                <button onClick={splitFinalize} disabled={isProcessing || cart.length === 0} className="w-full py-6 rounded-[32px] bg-blue-600 text-white font-black text-xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all">CONFIRMAR VENTA</button>
                            </div>
                        </div>
                    </div>
                )}

                {showTransferInfo && (
                    <div className="fixed inset-0 z-120 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white rounded-[56px] shadow-2xl max-w-md w-full p-10 space-y-8 animate-in zoom-in-95 duration-300 border border-white/20 text-gray-900">
                            <div className="text-center space-y-3">
                                <div className="w-24 h-24 mx-auto bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center shadow-inner">
                                    {showTransferInfo === 'mp' ? <Smartphone size={48} /> : <ArrowRight size={48} />}
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter uppercase">Datos de Pago</h2>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[4px]">Escanee o copie para pagar</p>
                            </div>

                            <div className="bg-gray-50 rounded-[40px] p-8 space-y-6 border border-gray-100">
                                <DetailRow label="TITULAR" value={showTransferInfo === 'mp' ? MP_DETAILS.titular : BANK_DETAILS.titular} />
                                <DetailRow label="ALIAS" value={showTransferInfo === 'mp' ? MP_DETAILS.alias : BANK_DETAILS.alias} copy />
                                <DetailRow label={showTransferInfo === 'mp' ? "CVU" : "CBU"} value={showTransferInfo === 'mp' ? MP_DETAILS.cvu : BANK_DETAILS.cbu} copy />
                                <div className="pt-4 border-t border-dashed">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comprobante / Ref.</p>
                                    <input type="text" className="w-full bg-black border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                                </div>
                            </div>

                            <div className="pt-4 space-y-4 text-center">
                                <button
                                    onClick={() => {
                                        const method = showTransferInfo === 'mp' ? 'mp_transferencia' : 'transferencia';
                                        const methods = { efectivo: 0, debito: 0, credito: 0, transferencia: 0, mercadopago: 0, mp_transferencia: 0 };
                                        methods[method] = total;
                                        finalizeSaleInternal(methods);
                                        setShowTransferInfo(null);
                                    }}
                                    className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 size={24} /> PAGO RECIBIDO
                                </button>
                                <button onClick={() => setShowTransferInfo(null)} className="text-gray-400 font-bold hover:text-gray-600 text-xs uppercase tracking-widest">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in pb-10">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Ventas</h1>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">POS OPERATIVO</p>
                </div>
                <button
                    onClick={() => window.open('/pos', 'PosTerminal', 'width=1600,height=1000')}
                    className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                >
                    <Smartphone size={20} /> MODUE FULLSCREEN / KIOSCO
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)]">
                <div className="flex-1 flex flex-col gap-6 bg-white p-6 rounded-3xl shadow-sm border min-h-0">
                    <div className="relative">
                        <Search className="absolute left-5 top-5 text-gray-400" size={24} />
                        <input ref={searchInputRef} className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" placeholder="¿Qué vendemos hoy?..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border overflow-hidden">
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full flex justify-between items-center p-5 hover:bg-blue-50 text-left border-b last:border-0 transition-colors group">
                                        <div><span className="font-bold text-gray-800 group-hover:text-blue-600 block">{p.name}</span><small className="text-gray-400">Stock: {p.stock_quantity}</small></div>
                                        <div className="flex items-center gap-4 text-gray-800 font-black text-xl">${p.price} <Plus size={20} className="text-blue-500" /></div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50 text-center"><ShoppingCart size={80} /><p className="font-bold">Carrito vacío<br /><small className="font-medium text-xs">Busca productos arriba para empezar</small></p></div>}
                        {cart.map(i => (
                            <div key={i.id} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl mb-4 group hover:bg-gray-100 transition-colors">
                                <div className="flex-1 min-w-0"><p className="font-black text-gray-800 leading-tight truncate">{i.name}</p><p className="text-xs text-gray-400 font-bold">${i.price} c/u</p></div>
                                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border">
                                    <button onClick={() => updateQty(i.id, -1)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Minus size={20} /></button>
                                    <span className="w-10 text-center font-black text-gray-800 text-lg">{i.quantity}</span>
                                    <button onClick={() => updateQty(i.id, 1)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Plus size={20} /></button>
                                </div>
                                <div className="w-28 text-right font-black text-gray-800 text-xl">${(i.price * i.quantity).toFixed(2)}</div>
                                <button onClick={() => setCart(c => c.filter(x => x.id !== i.id))} className="text-gray-300 hover:text-red-500 p-2 ml-2"><Trash2 size={24} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full lg:w-[450px] flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-8 flex-1">
                        <div className="text-center pb-6 border-b-2 border-dashed">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</h2>
                            <div className="text-5xl font-black text-blue-600">${total.toFixed(2)}</div>
                            {discounts > 0.01 && <div className="inline-block mt-3 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black italic">Ahorro: -${discounts.toFixed(2)}</div>}
                        </div>

                        {!isSplitPayment ? (
                            <div className="space-y-4">
                                <p className="text-center text-sm font-bold text-gray-400 uppercase">Seleccione Pago</p>
                                <QuickPayBtn icon={<DollarSign />} label="EFECTIVO" color="blue" onClick={() => quickFinalize('efectivo')} disabled={cart.length === 0 || isProcessing} />
                                {/* <QuickPayBtn icon={<Smartphone />} label="MERCADO PAGO" color="cyan" onClick={() => quickFinalize('mercadopago')} disabled={cart.length === 0 || isProcessing} /> */}
                                {/* <QuickPayBtn icon={<CreditCard />} label="TARJETAS" color="emerald" onClick={() => quickFinalize('debito')} disabled={cart.length === 0 || isProcessing} /> */}
                                <button onClick={() => setIsSplitPayment(true)} className="w-full py-4 text-sm font-bold text-gray-400 hover:text-blue-600 border border-dashed rounded-2xl transition-all uppercase">Más opciones / Mixto</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs font-black text-gray-800 uppercase tracking-widest">PAGO ESPECIAL <button onClick={() => setIsSplitPayment(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button></div>
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                                    <PayRow label="Efectivo" icon={<DollarSign size={16} />} val={paymentMethods.efectivo} set={v => setPaymentMethods(p => ({ ...p, efectivo: v }))} onFill={() => setPaymentMethods(p => ({ ...p, efectivo: (parseFloat(p.efectivo) || 0) + balance }))} />
                                    <PayRow label="Tarjeta" icon={<CreditCard size={16} />} val={paymentMethods.debito} set={v => setPaymentMethods(p => ({ ...p, debito: v }))} onFill={() => setPaymentMethods(p => ({ ...p, debito: (parseFloat(p.debito) || 0) + balance }))} />
                                    <PayRow label="MP QR" icon={<Smartphone size={16} />} val={paymentMethods.mercadopago} set={v => setPaymentMethods(p => ({ ...p, mercadopago: v }))} onFill={() => setPaymentMethods(p => ({ ...p, mercadopago: (parseFloat(p.mercadopago) || 0) + balance }))} />
                                    <PayRow label="Transferencia" icon={<ArrowRight size={16} />} val={paymentMethods.transferencia} set={v => setPaymentMethods(p => ({ ...p, transferencia: v }))} onFill={() => setPaymentMethods(p => ({ ...p, transferencia: (parseFloat(p.transferencia) || 0) + balance }))} />
                                </div>
                                <div className={`p-5 rounded-2xl flex justify-between items-center font-black text-lg ${balance <= 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                                    <span>{balance <= 0.01 ? 'CUBIERTO' : 'SALDO'}</span>
                                    <span>${Math.abs(balance).toFixed(2)}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nota</p>
                                    <input type="text" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-900" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                                </div>
                                <button onClick={splitFinalize} disabled={isProcessing || cart.length === 0} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">FINALIZAR VENTA</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showTransferInfo && (
                <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                                {showTransferInfo === 'mp' ? <Smartphone size={40} /> : <ArrowRight size={40} />}
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Transferencia</h2>
                        </div>
                        <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border">
                            <DetailRow label="TITULAR" value={showTransferInfo === 'mp' ? MP_DETAILS.titular : BANK_DETAILS.titular} />
                            <DetailRow label="ALIAS" value={showTransferInfo === 'mp' ? MP_DETAILS.alias : BANK_DETAILS.alias} copy />
                            <DetailRow label={showTransferInfo === 'mp' ? "CVU" : "CBU"} value={showTransferInfo === 'mp' ? MP_DETAILS.cvu : BANK_DETAILS.cbu} copy />
                            <input type="text" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-900" placeholder="Comprobante..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                        </div>
                        <button
                            onClick={() => {
                                const method = showTransferInfo === 'mp' ? 'mp_transferencia' : 'transferencia';
                                const methods = { efectivo: 0, debito: 0, credito: 0, transferencia: 0, mercadopago: 0, mp_transferencia: 0 };
                                methods[method] = total;
                                finalizeSaleInternal(methods);
                                setShowTransferInfo(null);
                            }}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all"
                        >
                            CONFIRMAR PAGO
                        </button>
                        <button onClick={() => setShowTransferInfo(null)} className="w-full text-center text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-[10px] tracking-widest">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, copy }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        Swal.fire({
            title: '¡Copiado!',
            text: `${label} copiado al portapapeles`,
            icon: 'success',
            timer: 1000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-3xl' }
        });
    };

    return (
        <div className="space-y-1 text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
            <div className="flex items-center justify-between gap-4">
                <p className="font-bold text-gray-800 break-all leading-tight">{value}</p>
                {copy && (
                    <button onClick={handleCopy} className="p-2 bg-white text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm border shrink-0">
                        <Plus size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

const QuickPayBtn = ({ icon, label, color, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`w-full py-5 px-6 bg-${color}-600 hover:bg-${color}-700 text-white rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-between font-black text-lg group disabled:opacity-30 disabled:pointer-events-none`}>
        <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">{icon}</div>
            {label}
        </div>
        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
    </button>
);

const PayRow = ({ label, icon, val, set, onFill }) => (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-colors">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</div>
            <label className="text-xs font-black text-gray-500 uppercase">{label}</label>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-black bg-white px-3 py-1 rounded-xl border shadow-sm">
                <span className="text-gray-400 text-xs">$</span>
                <input type="number" className="w-20 text-right bg-transparent outline-none text-gray-800 text-sm" value={val || ''} onChange={e => set(e.target.value)} onFocus={e => e.target.select()} />
            </div>
            <button onClick={onFill} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Completar saldo">
                <Plus size={16} />
            </button>
        </div>
    </div>
);

export default Sales;
