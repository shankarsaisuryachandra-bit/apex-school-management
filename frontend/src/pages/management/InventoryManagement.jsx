import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiCube, HiPlus, HiXMark, HiMapPin, HiWrench } from 'react-icons/hi2'

export default function InventoryManagement() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'LAB',
    quantity: 10,
    location: 'Science Block 1',
    assetCondition: 'GOOD'
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory')
      setAssets(data)
    } catch (error) {
      console.error('Failed to fetch school inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async (e) => {
    e.preventDefault()
    if (!formData.itemName || formData.quantity === '') return
    const qty = parseInt(formData.quantity, 10)
    if (isNaN(qty) || qty < 0 || qty > 100000) {
      setMessage('Quantity must be in the permitted range [0 - 100,000].')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      await api.post('/inventory', {
        ...formData,
        quantity: qty
      })
      setMessage('Asset registered in school inventory!')
      setTimeout(() => {
        setMessage('')
        setShowAddModal(false)
        setFormData({ itemName: '', category: 'LAB', quantity: 10, location: 'Science Block 1', assetCondition: 'GOOD' })
        fetchInventory()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to register asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Inventory & Assets</h1>
          <p className="text-surface-700/60 mt-1">Institutional physical assets, laboratory equipment, computers, and furniture</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <HiPlus className="w-4 h-4" />
          Add Inventory Asset
        </button>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading school inventory...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiCube className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No inventory assets registered yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Condition</th>
                  <th>Last Inspected</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((ast, idx) => (
                  <tr key={ast.id}>
                    <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="font-semibold text-surface-900">{ast.itemName}</td>
                    <td>
                      <span className="px-2.5 py-1 rounded-lg bg-surface-100 text-surface-700 text-xs font-bold uppercase">
                        {ast.category}
                      </span>
                    </td>
                    <td className="font-bold text-primary-700">{ast.quantity} units</td>
                    <td className="text-sm text-surface-700/80">
                      <span className="flex items-center gap-1">
                        <HiMapPin className="w-3.5 h-3.5 text-surface-400" />
                        {ast.location}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        ast.assetCondition === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                        ast.assetCondition === 'GOOD' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ast.assetCondition}
                      </span>
                    </td>
                    <td className="text-sm text-surface-400">{ast.lastInspected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Add Inventory Asset</h3>
            <p className="text-sm text-surface-700/60 mb-4">Register new equipment or school property</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell i7 Desktop Station"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field py-2"
                  >
                    <option value="LAB">LAB EQUIPMENT</option>
                    <option value="COMPUTER">COMPUTER & IT</option>
                    <option value="FURNITURE">FURNITURE</option>
                    <option value="SPORTS">SPORTS GEAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Room / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Lab 3 - Block A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Condition</label>
                <select
                  value={formData.assetCondition}
                  onChange={(e) => setFormData({ ...formData, assetCondition: e.target.value })}
                  className="input-field py-2"
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="REPAIR_NEEDED">REPAIR NEEDED</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
