import { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import { HiBookOpen, HiMagnifyingGlass, HiPlus, HiXMark, HiCheckBadge } from 'react-icons/hi2'

export default function LibraryManagement() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'General',
    totalCopies: '10'
  })

  useEffect(() => {
    fetchBooks()
  }, [searchTerm])

  const fetchBooks = async () => {
    try {
      const url = searchTerm ? `/library/books?query=${encodeURIComponent(searchTerm)}` : '/library/books'
      const { data } = await api.get(url)
      setBooks(data)
    } catch (error) {
      console.error('Failed to fetch library books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBook = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.author) return
    const copies = parseInt(formData.totalCopies, 10)
    if (isNaN(copies) || copies < 1 || copies > 5000) {
      setMessage('Total stock copies must be in the permitted range [1 - 5000].')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      await api.post('/library/books', {
        ...formData,
        totalCopies: copies,
        availableCopies: copies
      })
      setMessage('Book added to library catalogue!')
      setTimeout(() => {
        setMessage('')
        setShowAddModal(false)
        setFormData({ title: '', author: '', isbn: '', category: 'General', totalCopies: '10' })
        fetchBooks()
      }, 1500)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add book')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Library Catalogue</h1>
          <p className="text-surface-700/60 mt-1">Book directory, stock availability, and borrowing catalogue</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <HiPlus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <HiMagnifyingGlass className="w-5 h-5 text-surface-400 ml-2" />
        <input
          type="text"
          placeholder="Search by book title, author, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none text-surface-900 placeholder:text-surface-400"
        />
      </div>

      {/* Books Table */}
      <div className="card p-6">
        {loading ? (
          <div className="animate-pulse text-surface-700/50 py-4">Loading library catalogue...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 text-surface-700/50">
            <HiBookOpen className="w-12 h-12 mx-auto mb-2 text-surface-300" />
            <p>No books found matching your query.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>ISBN</th>
                  <th>Total Stock</th>
                  <th>Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b, idx) => (
                  <tr key={b.id}>
                    <td className="text-surface-400 text-xs font-semibold">{idx + 1}</td>
                    <td className="font-semibold text-surface-900 flex items-center gap-2">
                      <HiBookOpen className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      {b.title}
                    </td>
                    <td className="text-sm text-surface-700/80">{b.author}</td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-100 font-medium text-xs text-surface-700">
                        {b.category || 'General'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-surface-400">{b.isbn || '—'}</td>
                    <td className="font-semibold text-surface-900">{b.totalCopies}</td>
                    <td className="font-bold text-accent-700">{b.availableCopies}</td>
                    <td>
                      <span className={`badge ${b.availableCopies > 0 ? 'badge-paid' : 'badge-unpaid'}`}>
                        {b.availableCopies > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="card-glass w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-surface-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-900">
              <HiXMark className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-display font-bold text-surface-900 mb-1">Add Library Book</h3>
            <p className="text-sm text-surface-700/60 mb-4">Add new publication to inventory</p>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-accent-100 text-accent-800 text-sm font-medium">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics for Scientists"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Author Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Halliday & Resnick"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Science"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">ISBN Number</label>
                  <input
                    type="text"
                    placeholder="978-0123456789"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase mb-1">Stock Copies</label>
                <input
                  type="number"
                  required
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
