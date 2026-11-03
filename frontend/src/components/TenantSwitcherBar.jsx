import { useTenant } from '../context/TenantContext'
import { HiBuildingLibrary, HiSparkles, HiChevronRight } from 'react-icons/hi2'

export default function TenantSwitcherBar() {
  const { currentTenant, tenants, switchTenant } = useTenant()

  if (!tenants || tenants.length <= 1) return null

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0F2942] to-slate-900 text-white py-2 px-4 border-b border-amber-500/30 text-xs shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        
        {/* Banner Tag */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
            <HiSparkles className="w-3 h-3" /> SaaS Multi-Tenant Mode
          </span>
          <span className="text-slate-300 hidden md:inline">
            Selling to multiple schools? Switch institution white-label profile:
          </span>
        </div>

        {/* Institution Tenant Selector */}
        <div className="flex items-center gap-2">
          <HiBuildingLibrary className="w-4 h-4 text-amber-400" />
          <select
            value={currentTenant?.tenantSlug || ''}
            onChange={(e) => switchTenant(e.target.value)}
            className="bg-slate-800 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-lg border border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {tenants.map(t => (
              <option key={t.tenantSlug} value={t.tenantSlug}>
                🏫 {t.schoolName} ({t.tenantSlug})
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  )
}
