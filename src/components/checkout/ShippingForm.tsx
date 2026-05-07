'use client'

import { useState } from 'react'
import type { Locale } from '@/types/domain'

export interface ShippingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  district: string
  address: string
  apartment: string
}

interface ShippingFormProps {
  locale: Locale
  onSubmit: (data: ShippingFormData) => void
}

export function ShippingForm({ locale, onSubmit }: ShippingFormProps) {
  const isRtl = locale === 'ar'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    apartment: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        <Input
          label={isRtl ? 'الاسم الأول' : 'First Name'}
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <Input
          label={isRtl ? 'اسم العائلة' : 'Last Name'}
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <Input
          label={isRtl ? 'البريد الإلكتروني' : 'Email Address'}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="md:col-span-2"
        />
        <Input
          label={isRtl ? 'رقم الجوال' : 'Phone Number'}
          name="phone"
          type="tel"
          placeholder="+966 5X XXX XXXX"
          value={formData.phone}
          onChange={handleChange}
          required
          className="md:col-span-2"
        />
        <Input
          label={isRtl ? 'المدينة' : 'City'}
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
        <Input
          label={isRtl ? 'الحي' : 'District'}
          name="district"
          value={formData.district}
          onChange={handleChange}
          required
        />
        <Input
          label={isRtl ? 'العنوان' : 'Street Address'}
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="md:col-span-2"
        />
        <Input
          label={isRtl ? 'الشقة / الفيلا (اختياري)' : 'Apartment / Villa (Optional)'}
          name="apartment"
          value={formData.apartment}
          onChange={handleChange}
          className="md:col-span-2"
        />
      </div>
    </form>
  )
}

function Input({ 
  label, 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder:text-white/10 
                   focus:outline-none focus:border-white transition-colors duration-300 rounded-none"
      />
    </div>
  )
}
