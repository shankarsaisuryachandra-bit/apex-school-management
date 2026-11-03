import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosConfig'

const TenantContext = createContext()

export function TenantProvider({ children }) {
  const [tenants, setTenants] = useState([])
  const [currentTenant, setCurrentTenant] = useState({
    schoolName: 'Apex International Academy',
    tagline: 'Excellence in Education & Character Building',
    tenantSlug: 'apex-academy',
    primaryColor: '#0F2942',
    accentColor: '#D97706',
    phone: '+91 98765 43210',
    email: 'admin@apexacademy.edu',
    address: '123 Academic Enclave, Education Knowledge City',
    principalName: 'Dr. E. Vance',
    trustBadge1: 'CBSE Affiliated',
    trustBadge2: '100% Board Pass Rate',
    trustBadge3: 'Robotics & STEM Labs',
    trustBadge4: 'GPS Bus Fleet',
    ctaPrimaryLabel: 'Enter Institutional Portals',
    ctaSecondaryLabel: 'View Academic Divisions',
    footerTagline: 'Designed with Classic Institutional Architecture.',
    upiId: 'apexschool.fee@upi'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const res = await api.get('/cms/tenants')
      if (res.data && res.data.length > 0) {
        setTenants(res.data)
        // Default to first tenant or saved tenant
        const savedSlug = localStorage.getItem('saas_tenant_slug')
        const match = res.data.find(t => t.tenantSlug === savedSlug) || res.data[0]
        applyTenant(match)
      }
    } catch (err) {
      console.error('Failed to load SaaS tenant profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyTenant = (tenant) => {
    setCurrentTenant(tenant)
    localStorage.setItem('saas_tenant_slug', tenant.tenantSlug)

    // Dynamic document title
    document.title = `${tenant.schoolName} — Official SaaS ERP Portal`

    // Inject CSS Theme Variables
    if (tenant.primaryColor) {
      document.documentElement.style.setProperty('--primary-theme-color', tenant.primaryColor)
    }
    if (tenant.accentColor) {
      document.documentElement.style.setProperty('--accent-theme-color', tenant.accentColor)
    }
  }

  const switchTenant = (tenantSlug) => {
    const found = tenants.find(t => t.tenantSlug === tenantSlug)
    if (found) {
      applyTenant(found)
    }
  }

  return (
    <TenantContext.Provider value={{ currentTenant, tenants, switchTenant, loading }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
