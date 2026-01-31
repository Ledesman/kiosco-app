import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, Barcode, Layers, AlertTriangle, ImageIcon, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';

const ProductModal = ({ isOpen, onClose, onSave, product = null, categories = [] }) => {
 const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_alert: 5,
    category_id: '',
    stock_unit: 'unidad',
    sale_type: 'unidad',  // Added default value
    price_per_kg: '',   // Added
    supplier_id: '',    // Added
    barcode: '',
    image_url: '',
    image: null,
    imagePreview: ''
});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                price: product.price || '',
                price_per_kg: product.price_per_kg || '',
                stock_unit: product.stock_unit || 'unidad',
                min_stock_alert: product.min_stock_alert !== undefined ? product.min_stock_alert : 5,
                barcode: product.barcode || '',
                image_url: product.image_url || ''
            });
        } else {
            setFormData({
                name: '',
                category_id: categories.length > 0 ? categories[0].id : '',
                price: '',
                sale_type: 'unidad',
                price_per_kg: '',
                stock_quantity: '',
                stock_unit: 'unidad',
                min_stock_alert: 5,
                barcode: '',
                image_url: '',
                image: null,
                imagePreview: ''
            });
        }
        setError('');
    }, [product, isOpen, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                image: file,
                imagePreview: reader.result
            }));
        };
        reader.readAsDataURL(file);
    }
};

const removeImage = () => {
    setFormData(prev => ({
        ...prev,
        image: null,
        imagePreview: ''
    }));
};
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // Create FormData and append all fields
        const formDataToSend = new FormData();
        
        // Required fields
        formDataToSend.append('name', formData.name);
        formDataToSend.append('price', parseFloat(formData.price).toFixed(2));
        formDataToSend.append('stock_quantity', parseInt(formData.stock_quantity, 10));
        formDataToSend.append('category_id', formData.category_id);
        formDataToSend.append('stock_unit', formData.stock_unit || 'unidad');
        formDataToSend.append('sale_type', formData.sale_type || 'unidad'); // Added required field
        
        // Optional fields with null checks
        if (formData.barcode) formDataToSend.append('barcode', formData.barcode);
        if (formData.description) formDataToSend.append('description', formData.description);
        if (formData.min_stock_alert) formDataToSend.append('min_stock_alert', parseInt(formData.min_stock_alert, 10));
        if (formData.cost) formDataToSend.append('cost', parseFloat(formData.cost).toFixed(2));
        if (formData.price_per_kg) formDataToSend.append('price_per_kg', parseFloat(formData.price_per_kg).toFixed(2));
        if (formData.supplier_id) formDataToSend.append('supplier_id', formData.supplier_id);
        
        // Handle image upload if present
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        // Log the data being sent (for debugging)
        console.log('Sending form data:');
        for (let [key, value] of formDataToSend.entries()) {
            console.log(key, value);
        }

        let response;
        if (product) {
            // Update existing product
            response = await api.patch(`/products/${product.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onSave('Producto actualizado exitosamente');
        } else {
            // Create new product
            response = await api.post('/products', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onSave('Producto creado exitosamente');
        }
        
        console.log('Server response:', response.data);
        onClose();
    } catch (err) {
        console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            headers: err.response?.headers
        });
        setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
        setLoading(false);
    }
};
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Package size={24} />
                        </div>
                        <h2 className="text-xl font-bold">
                            {product ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-xl">
                            <AlertTriangle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Package size={16} className="text-blue-500" /> Nombre del Producto
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Coca Cola 500ml"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Tag size={16} className="text-blue-500" /> Categoría
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                required
                            >
                                <option value="">Seleccionar categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                         {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                            <ImageIcon size={16} className="text-emerald-500" /> Imagen de la Categoría
                        </label>
                        <div className="mt-1 flex items-center gap-4">
                            {formData.imagePreview ? (
                                <div className="relative group">
                                    <img 
                                        src={formData.imagePreview} 
                                        alt="Vista previa" 
                                        className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                    <ImageIcon size={24} />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    id="category-image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="category-image"
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {formData.imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    PNG, JPG, GIF hasta 2MB
                                </p>
                            </div>
                        </div>
                    </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Barcode size={16} className="text-blue-500" /> Código de Barras
                            </label>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Escanear o ingresar"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <DollarSign size={16} className="text-blue-500" /> Precio de Venta
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    name="price"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <Layers size={16} className="text-blue-500" /> Stock Inicial
                            </label>
                            <input
                                type="number"
                                name="stock_quantity"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* Min Stock Alert */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 items-center gap-2">
                                <AlertTriangle size={16} /> Alerta Stock Mínimo
                            </label>
                            <input
                                type="number"
                                name="min_stock_alert"
                                value={formData.min_stock_alert}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                placeholder="5"
                            />
                        </div>

                        {/* Sale Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Venta</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="sale_type"
                                        value="unit"
                                        checked={formData.sale_type === 'unit'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm">Unidad</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="sale_type"
                                        value="kg"
                                        checked={formData.sale_type === 'kg'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm">Peso (Kg)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <Save size={20} />
                                    {product ? 'Actualizar' : 'Guardar Producto'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
