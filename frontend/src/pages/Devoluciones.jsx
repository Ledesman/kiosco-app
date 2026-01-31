import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, Package, DollarSign, Calendar, User, CheckCircle, AlertCircle, X, Receipt, TrendingDown } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Devoluciones = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [productosDevolucion, setProductosDevolucion] = useState([]);
    const [motivo, setMotivo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mover la función buscarVentas antes del useEffect
    const buscarVentas = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/devoluciones/buscar-venta?query=${searchTerm}`);
            setSearchResults(response.data.ventas || []);
        } catch (error) {
            console.error('Error al buscar ventas:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]);

    // Ahora este useEffect puede usar buscarVentas de manera segura
    useEffect(() => {
        if (searchTerm.trim().length > 2) {
            buscarVentas();
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, buscarVentas]);

    const seleccionarVenta = async (venta) => {
        try {
            const response = await api.get(`/devoluciones/venta/${venta.id}`);
            setVentaSeleccionada(response.data.venta);

            // Inicializar productos para devolución
            const productosParaDevolucion = response.data.venta.productos.map(p => ({
                ...p,
                cantidadDevolver: 0,
                motivo: ''
            }));
            setProductosDevolucion(productosParaDevolucion);
            setSearchResults([]);
            setSearchTerm('');
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la venta seleccionada'
            });
        }
    };

    const handleCantidadChange = (index, value) => {
        const newProductos = [...productosDevolucion];
        newProductos[index].cantidadDevolver = value;
        setProductosDevolucion(newProductos);
    };

    const handleMotivoChange = (index, value) => {
        const newProductos = [...productosDevolucion];
        newProductos[index].motivo = value;
        setProductosDevolucion(newProductos);
    };

    const procesarDevolucion = async () => {
        try {
            const productosAdevolver = productosDevolucion
                .filter(p => p.cantidadDevolver > 0)
                .map(p => ({
                    ventaProductoId: p.id,
                    producto_id: p.producto_id,
                    cantidad: p.cantidadDevolver,
                    motivo: p.motivo
                }));

            if (productosAdevolver.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Atención',
                    text: 'Debe seleccionar al menos un producto para devolver'
                });
                return;
            }

            // Enviar datos al backend
            const response = await api.post('/devoluciones', {
                ventaId: ventaSeleccionada.id,
                productos: productosAdevolver,
                motivo: motivo || 'Devolución general'
            });

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: response.data.message || 'Devolución procesada correctamente'
            });

            // Limpiar formulario
            setVentaSeleccionada(null);
            setProductosDevolucion([]);
            setMotivo('');

        } catch (error) {
            console.error('Error al procesar devolución:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.response?.data?.error || 'No se pudo procesar la devolución'
            });
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Devoluciones</h1>

            {!ventaSeleccionada ? (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar venta por ticket..."
                            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {isLoading && <div className="text-center py-4">Buscando ventas...</div>}

                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map((venta) => (
                                <div
                                    key={venta.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => seleccionarVenta(venta)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">Ticket: {venta.ticket_number}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(venta.fecha_venta).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${venta.total}</p>
                                            <p className="text-sm text-gray-600">{venta.cliente_nombre || 'Cliente no registrado'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b">
                        <div className="flex items-center mb-4">
                            <button
                                onClick={() => {
                                    setVentaSeleccionada(null);
                                    setProductosDevolucion([]);
                                }}
                                className="mr-4 text-blue-600 hover:text-blue-800"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl font-semibold">Devolución para ticket: {ventaSeleccionada.ticket_number}</h2>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-medium mb-2">Productos</h3>
                            <div className="space-y-4">
                                {productosDevolucion.map((producto, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{producto.name || 'Producto sin nombre'}</p>
                                                <p className="text-sm text-gray-600">Código: {producto.barcode || 'N/A'}</p>
                                                <p className="text-sm">Precio unitario: ${Number(producto.price || 0).toFixed(2)}</p>
                                                <p className="text-sm">Cantidad comprada: {Number(producto.quantity || producto.cantidad || 0)} {producto.sale_type === 'kg' ? 'kg' : 'unidades'}</p>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cantidad a devolver
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step={producto.unit_type === 'kg' ? '0.001' : '1'}
                                                    max={producto.quantity || producto.cantidad || (producto.unit_type === 'kg' ? '1000' : '100')}
                                                    value={producto.cantidadDevolver === 0 ? '' : producto.cantidadDevolver}
                                                    onChange={(e) => {
                                                        const val = e.target.value;

                                                        // Allow empty input
                                                        if (val === '') {
                                                            handleCantidadChange(index, 0);
                                                            return;
                                                        }

                                                        const numVal = parseFloat(val);
                                                        if (isNaN(numVal)) return;

                                                        const max = producto.quantity || producto.cantidad;

                                                        // Validar solo si excede el máximo para feedback visual, pero permitir escribir
                                                        // O simplemente limitar al onBlur si se prefiere, pero aquí limitaremos al maximo real si se pasa
                                                        if (numVal > max) {
                                                            // Optional: Show valid max immediately
                                                            handleCantidadChange(index, max);
                                                        } else if (numVal >= 0) {
                                                            handleCantidadChange(index, numVal); // Pass float
                                                        }
                                                    }}
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onKeyDown={(e) => {
                                                        if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Motivo de la devolución
                                            </label>
                                            <input
                                                type="text"
                                                value={producto.motivo}
                                                onChange={(e) => handleMotivoChange(index, e.target.value)}
                                                placeholder="Motivo de la devolución"
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo general de la devolución
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full p-2 border rounded"
                                rows="3"
                                placeholder="Motivo general de la devolución (opcional)"
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={procesarDevolucion}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Procesar Devolución
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devoluciones;