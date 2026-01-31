import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const MySwal = withReactContent(Swal);
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    AlertCircle,
    Package,
    Barcode,
    ChevronRight,
    RefreshCw,
    Download,
    FileText,
    ImageIcon,
    X,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    RotateCw
} from 'lucide-react';
import api from '../services/api';
import ProductModal from '../components/ProductModal';
import Pagination from '../components/Pagination';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imagePreview, setImagePreview] = useState({
        open: false,
        src: '',
        name: '',
        zoom: 1,
        rotation: 0,
        isFullscreen: false
    });
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isCajero = user?.role === 'cajero';

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products', {
                    params: {
                        search: searchTerm,
                        category_id: selectedCategory,
                        low_stock: showLowStock
                    }
                }),
                api.get('/categories')
            ]);

            // Handle the response based on your API structure
            // If the API returns the array directly:
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
            setCurrentPage(1); // Reset to first page on new data fetch

            // OR if it's in a 'products' property:
            // setProducts(Array.isArray(prodRes.data?.products) ? prodRes.data.products : []);

            setCategories(catRes.data?.categories || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setProducts([]); // Ensure products is always an array
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, showLowStock]);

    const openImagePreview = (imageUrl, productName) => {
        setImagePreview({
            open: true,
            src: imageUrl,
            name: productName,
            zoom: 1,
            rotation: 0,
            isFullscreen: false
        });
    };

    const handleZoomIn = () => {
        setImagePreview(prev => ({
            ...prev,
            zoom: Math.min(prev.zoom + 0.25, 3)
        }));
    };

    const handleZoomOut = () => {
        setImagePreview(prev => ({
            ...prev,
            zoom: Math.max(prev.zoom - 0.25, 0.5)
        }));
    };

    const handleRotate = () => {
        setImagePreview(prev => ({
            ...prev,
            rotation: (prev.rotation + 90) % 360
        }));
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setImagePreview(prev => ({
            ...prev,
            isFullscreen: !prev.isFullscreen
        }));
    };

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            setImagePreview(prev => ({
                ...prev,
                isFullscreen: !!document.fullscreenElement
            }));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const closeImagePreview = () => {
        setImagePreview({ open: false, src: '' });
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl px-6 py-2',
                cancelButton: 'rounded-xl px-6 py-2'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/products/${id}`);
                fetchData();
                MySwal.fire({
                    title: 'Eliminado',
                    text: 'El producto ha sido eliminado.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' }
                });
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                MySwal.fire({
                    title: 'Error',
                    text: 'No se pudo eliminar el producto.',
                    icon: 'error',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            { 'Nombre': 'Ejemplo Producto', 'Categoría ID': categories[0]?.id || 1, 'Precio': 100, 'Stock': 10, 'Unidad': 'Unidad', 'Código': '123456789' }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "Plantilla_Productos.xlsx");
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    Swal.fire('Error', 'El archivo está vacío', 'error');
                    return;
                }

                const formattedProducts = json.map(item => ({
                    name: item['Nombre'],
                    category_id: item['Categoría ID'],
                    price: item['Precio'],
                    stock_quantity: item['Stock'],
                    stock_unit: item['Unidad'] || 'Unidad',
                    barcode: item['Código']?.toString(),
                    sale_type: 'unit'
                }));

                await api.post('/products/bulk-import', { products: formattedProducts });
                Swal.fire('Éxito', `${formattedProducts.length} productos importados correctamente`, 'success');
                fetchData();
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'No se pudo procesar el archivo. Verifique el formato.', 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = Array.isArray(products) ? products.slice(indexOfFirstItem, indexOfLastItem) : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        Gestión de Productos
                    </h1>
                    <p className="text-gray-500 mt-1">Administra el inventario, precios y stock de tu kiosco.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={20} />
                        Plantilla
                    </button>
                    <label className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                        <FileText size={20} />
                        Importar Excel
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código de barras..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="pl-11 pr-8 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowLowStock(!showLowStock)}
                        className={`px-6 py-3 rounded-2xl font-medium transition-all flex items-center gap-2 ${showLowStock
                            ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-500'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <AlertCircle size={18} />
                        Stock Bajo
                    </button>

                    <button
                        onClick={fetchData}
                        className="p-3 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                        title="Refrescar"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Imagen</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                // Loading state
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : !Array.isArray(products) || products.length === 0 ? (
                                // No products or error state
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Package size={48} />
                                            <p className="text-lg font-medium">No se encontraron productos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                // Products list
                                currentProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                                                    {product.name?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500">{product.barcode || 'Sin código'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                                {product.category_name || 'Sin categoría'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ${parseFloat(product.price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${(product.stock_quantity || 0) <= (product.min_stock_alert || 0)
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {product.stock_quantity || 0} {product.stock_unit || 'unid.'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.image_url ? (
                                                <div className="relative group">
                                                    <img
                                                        src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:5002${product.image_url}`}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                                        onClick={() => openImagePreview(
                                                            product.image_url.startsWith('http') ? product.image_url : `http://localhost:5002${product.image_url}`,
                                                            product.name
                                                        )}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <ImageIcon className="text-white" size={16} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-2">
                                            <div className="flex justify-end gap-2">
                                                {(isAdmin || isCajero) && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openImagePreview(
                                                                product.image_url.startsWith('http') ? product.image_url : `http://localhost:5002${product.image_url}`,
                                                                product.name
                                                            )}
                                                            disabled={!product.image_url}
                                                            className={`p-1.5 rounded-md ${product.image_url
                                                                ? 'text-blue-600 hover:bg-blue-50'
                                                                : 'text-gray-300 cursor-not-allowed'
                                                                }`}
                                                            title={product.image_url ? 'Ver imagen' : 'Sin imagen'}
                                                        >
                                                            <ImageIcon size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(products.length / itemsPerPage)}
                onPageChange={setCurrentPage}
            />

            {/* Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={fetchData}
                product={editingProduct}
                categories={categories}
            />

            {/* Image Preview Modal */}
            {imagePreview.open && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closeImagePreview}>
                    <div
                        className={`relative ${imagePreview.isFullscreen ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'} bg-gray-900 rounded-xl shadow-2xl overflow-hidden transition-all duration-300`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0  from-black/80 to-transparent p-4 flex justify-between items-center z-10">
                            <h3 className="text-white font-medium text-lg truncate max-w-[70%]">
                                {imagePreview.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Acercar"
                                >
                                    <ZoomIn size={20} />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Alejar"
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <button
                                    onClick={handleRotate}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Rotar"
                                >
                                    <RotateCw size={20} />
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                    title={imagePreview.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                                >
                                    {imagePreview.isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                                <button
                                    onClick={closeImagePreview}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Cerrar"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                            <div
                                className="relative transition-transform duration-300"
                                style={{
                                    transform: `scale(${imagePreview.zoom}) rotate(${imagePreview.rotation}deg)`,
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                            >
                                <img
                                    src={imagePreview.src}
                                    alt={`Imagen de ${imagePreview.name}`}
                                    className="max-w-full max-h-[80vh] object-contain"
                                    style={{
                                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Zoom level indicator */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            {Math.round(imagePreview.zoom * 100)}%
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
