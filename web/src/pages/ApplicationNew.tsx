import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  IndianRupee,
  User,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { getAllCompanies, upsertCompany, createApplication } from '@/lib/db';
import { ApplicationStatus, EmploymentType, WorkArrangement, Company } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/lib/statusHelpers';

export default function ApplicationNew() {
  const navigate = useNavigate();

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | null>('full-time');
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement | null>('remote');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');

  // Expandable Sections
  const [showWorkDetails, setShowWorkDetails] = useState(true);
  const [showCompensation, setShowCompensation] = useState(true);
  const [showRecruiter, setShowRecruiter] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Autocomplete
  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const jobTitleInputRef = useRef<HTMLInputElement>(null);
  const companyNameInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ jobTitle?: string; companyName?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    getAllCompanies().then(setExistingCompanies).catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompanyNameChange = (text: string) => {
    setCompanyName(text);
    if (errors.companyName) setErrors(e => ({ ...e, companyName: undefined }));
    if (formError) setFormError(null);
    if (text.trim().length > 0) {
      const matches = existingCompanies.filter(c =>
        c?.name && c.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCompanies(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestedCompany = (comp: Company) => {
    setCompanyName(comp.name);
    if (comp.location && !location) {
      setLocation(comp.location);
    }
    setShowSuggestions(false);
  };

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    setFormError(null);

    const errs: { jobTitle?: string; companyName?: string } = {};
    if (!jobTitle.trim()) errs.jobTitle = 'Job title is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setFormError('Please fill in required fields: Job Title and Company Name');
      if (!jobTitle.trim()) {
        jobTitleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        jobTitleInputRef.current?.focus();
      } else if (!companyName.trim()) {
        companyNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        companyNameInputRef.current?.focus();
      }
      return;
    }

    setSaving(true);
    try {
      // 1. Get or create company
      const companies = await getAllCompanies();
      let company = companies.find(
        c => c?.name && c.name.toLowerCase() === companyName.trim().toLowerCase()
      );
      if (!company) {
        company = await upsertCompany({
          name: companyName.trim(),
          location: location.trim() || undefined,
        });
      }

      // 2. Parse numbers cleanly (remove commas if entered)
      const cleanMin = salaryMin.replace(/,/g, '').trim();
      const cleanMax = salaryMax.replace(/,/g, '').trim();
      const parsedMin = cleanMin && !isNaN(Number(cleanMin)) ? Number(cleanMin) : null;
      const parsedMax = cleanMax && !isNaN(Number(cleanMax)) ? Number(cleanMax) : null;

      // 3. Format job URL if provided
      let formattedUrl = jobUrl.trim();
      if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      // 4. Create application
      const newApp = await createApplication({
        company_id: company.id,
        job_title: jobTitle.trim(),
        status,
        location: location.trim() || null,
        employment_type: employmentType || null,
        work_arrangement: workArrangement || null,
        salary_min: parsedMin,
        salary_max: parsedMax,
        currency,
        job_url: formattedUrl || null,
        job_description: jobDescription.trim() || null,
        recruiter_name: recruiterName.trim() || null,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_phone: recruiterPhone.trim() || null,
        recruiter_linkedin: null,
        resume_id: null,
        source: null,
      });

      setSuccessMsg('Opportunity saved successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/applications/${newApp.id}`);
      }, 400);
    } catch (err: any) {
      console.error('Failed to save application:', err);
      setFormError('Failed to save application: ' + (err.message || 'Unknown error'));
      setSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--color-jp-bg)',
      }}
    >
      <TopBar
        title="New Application"
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/applications')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid var(--color-jp-border)',
                background: 'transparent',
                color: 'var(--color-jp-secondary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '6px 18px',
                borderRadius: 6,
                border: 'none',
                background: saving ? 'var(--color-jp-secondary)' : 'var(--color-jp-accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px', maxWidth: '840px', width: '100%', margin: '0 auto' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/applications"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--color-jp-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back to Applications
          </Link>
        </div>

        {/* Form Container */}
        <form noValidate onSubmit={handleSave}>
          {/* Top Error Alert */}
          {formError && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--color-status-rejected-bg)',
                border: '1px solid var(--color-status-rejected)',
                color: 'var(--color-status-rejected)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Top Success Alert */}
          {successMsg && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--color-status-offer-bg)',
                border: '1px solid var(--color-status-offer)',
                color: 'var(--color-status-offer)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Core Opportunity Info */}
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Briefcase size={18} color="var(--color-jp-accent)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-jp-text)' }}>
                Opportunity Details
              </h2>
            </div>

            {/* Job Title Input */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-jp-secondary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Job Title <span style={{ color: 'var(--color-status-rejected)' }}>*</span>
              </label>
              <input
                ref={jobTitleInputRef}
                type="text"
                placeholder="e.g. Senior Full-Stack Engineer"
                value={jobTitle}
                onChange={e => {
                  setJobTitle(e.target.value);
                  if (errors.jobTitle) setErrors(err => ({ ...err, jobTitle: undefined }));
                  if (formError) setFormError(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.jobTitle ? 'var(--color-status-rejected)' : 'var(--color-jp-border)'}`,
                  background: 'var(--color-jp-bg)',
                  color: 'var(--color-jp-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.jobTitle && (
                <div style={{ color: 'var(--color-status-rejected)', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {errors.jobTitle}
                </div>
              )}
            </div>

            {/* Company Name Autocomplete */}
            <div ref={autocompleteRef} style={{ position: 'relative', marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-jp-secondary)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Company Name <span style={{ color: 'var(--color-status-rejected)' }}>*</span>
              </label>
              <input
                ref={companyNameInputRef}
                type="text"
                placeholder="e.g. Stripe, Razorpay, Google"
                value={companyName}
                onChange={e => handleCompanyNameChange(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.companyName ? 'var(--color-status-rejected)' : 'var(--color-jp-border)'}`,
                  background: 'var(--color-jp-bg)',
                  color: 'var(--color-jp-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.companyName && (
                <div style={{ color: 'var(--color-status-rejected)', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> {errors.companyName}
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--color-jp-surface)',
                    border: '1px solid var(--color-jp-border)',
                    borderRadius: 8,
                    marginTop: 4,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {filteredCompanies.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectSuggestedCompany(c)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-jp-border)',
                        fontSize: 13,
                        color: 'var(--color-jp-text)',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--color-jp-surface2)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Building2 size={15} color="var(--color-jp-accent)" />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      {c.location && (
                        <span style={{ fontSize: 11, color: 'var(--color-jp-secondary)' }}>
                          ({c.location})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Initial Status Selector (Horizontal Pill Group) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-jp-secondary)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Initial Status <span style={{ color: 'var(--color-status-rejected)' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_STATUSES.map(st => {
                  const isSelected = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: `1.5px solid ${isSelected ? `var(--color-status-${st})` : 'var(--color-jp-border)'}`,
                        background: isSelected ? `var(--color-status-${st}-bg)` : 'var(--color-jp-bg)',
                        color: isSelected ? `var(--color-status-${st})` : 'var(--color-jp-secondary)',
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: `var(--color-status-${st})`,
                        }}
                      />
                      {STATUS_LABELS[st]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 2: Work & Location (Collapsible) */}
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: 12,
              marginBottom: 20,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setShowWorkDetails(!showWorkDetails)}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--color-jp-surface)',
                borderBottom: showWorkDetails ? '1px solid var(--color-jp-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="var(--color-jp-accent)" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', margin: 0 }}>
                  Work & Location
                </h3>
              </div>
              {showWorkDetails ? (
                <ChevronUp size={18} color="var(--color-jp-secondary)" />
              ) : (
                <ChevronDown size={18} color="var(--color-jp-secondary)" />
              )}
            </div>

            {showWorkDetails && (
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India or Remote"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Work Arrangement Pills */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Work Arrangement
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['remote', 'hybrid', 'on-site'] as WorkArrangement[]).map(arr => {
                      const isSel = workArrangement === arr;
                      return (
                        <button
                          key={arr}
                          type="button"
                          onClick={() => setWorkArrangement(isSel ? null : arr)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSel ? 'var(--color-jp-accent)' : 'var(--color-jp-border)'}`,
                            background: isSel ? 'var(--color-jp-surface2)' : 'var(--color-jp-bg)',
                            color: isSel ? 'var(--color-jp-accent)' : 'var(--color-jp-text)',
                            fontSize: 13,
                            fontWeight: isSel ? 600 : 400,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {arr === 'on-site' ? 'On-site' : arr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Employment Type Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Employment Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {(['full-time', 'contract', 'part-time', 'internship'] as EmploymentType[]).map(emp => {
                      const isSel = employmentType === emp;
                      return (
                        <button
                          key={emp}
                          type="button"
                          onClick={() => setEmploymentType(isSel ? null : emp)}
                          style={{
                            padding: '8px 8px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSel ? 'var(--color-jp-accent)' : 'var(--color-jp-border)'}`,
                            background: isSel ? 'var(--color-jp-surface2)' : 'var(--color-jp-bg)',
                            color: isSel ? 'var(--color-jp-accent)' : 'var(--color-jp-text)',
                            fontSize: 12,
                            fontWeight: isSel ? 600 : 400,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            textAlign: 'center',
                          }}
                        >
                          {emp === 'full-time' ? 'Full-time' : emp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Compensation (Collapsible) */}
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: 12,
              marginBottom: 20,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setShowCompensation(!showCompensation)}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--color-jp-surface)',
                borderBottom: showCompensation ? '1px solid var(--color-jp-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IndianRupee size={18} color="var(--color-jp-accent)" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', margin: 0 }}>
                  Compensation
                </h3>
              </div>
              {showCompensation ? (
                <ChevronUp size={18} color="var(--color-jp-secondary)" />
              ) : (
                <ChevronDown size={18} color="var(--color-jp-secondary)" />
              )}
            </div>

            {showCompensation && (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                      Salary Minimum
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1200000 or 12,00,000"
                      value={salaryMin}
                      onChange={e => setSalaryMin(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid var(--color-jp-border)',
                        background: 'var(--color-jp-bg)',
                        color: 'var(--color-jp-text)',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                      Salary Maximum
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1800000 or 18,00,000"
                      value={salaryMax}
                      onChange={e => setSalaryMax(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid var(--color-jp-border)',
                        background: 'var(--color-jp-bg)',
                        color: 'var(--color-jp-text)',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 8px',
                        borderRadius: 8,
                        border: '1px solid var(--color-jp-border)',
                        background: 'var(--color-jp-bg)',
                        color: 'var(--color-jp-text)',
                        fontSize: 14,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {currency === 'INR' && (
                  <div style={{ fontSize: 12, color: 'var(--color-jp-secondary)', marginTop: 8 }}>
                    Tip: Enter values in INR (e.g. 1500000 for 15 LPA). JobPilot automatically formats this as <strong>₹15L</strong>.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 4: Recruiter & Contacts (Collapsible) */}
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: 12,
              marginBottom: 20,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setShowRecruiter(!showRecruiter)}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--color-jp-surface)',
                borderBottom: showRecruiter ? '1px solid var(--color-jp-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--color-jp-accent)" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', margin: 0 }}>
                  Recruiter & Contacts
                </h3>
              </div>
              {showRecruiter ? (
                <ChevronUp size={18} color="var(--color-jp-secondary)" />
              ) : (
                <ChevronDown size={18} color="var(--color-jp-secondary)" />
              )}
            </div>

            {showRecruiter && (
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Recruiter Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={recruiterName}
                    onChange={e => setRecruiterName(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Recruiter Email
                  </label>
                  <input
                    type="text"
                    placeholder="recruiter@company.com"
                    value={recruiterEmail}
                    onChange={e => setRecruiterEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Recruiter Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={recruiterPhone}
                    onChange={e => setRecruiterPhone(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Job Description & Posting Links (Collapsible) */}
          <section
            style={{
              background: 'var(--color-jp-surface)',
              border: '1px solid var(--color-jp-border)',
              borderRadius: 12,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setShowJobDetails(!showJobDetails)}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: 'var(--color-jp-surface)',
                borderBottom: showJobDetails ? '1px solid var(--color-jp-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="var(--color-jp-accent)" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-jp-text)', margin: 0 }}>
                  Job Description & Links
                </h3>
              </div>
              {showJobDetails ? (
                <ChevronUp size={18} color="var(--color-jp-secondary)" />
              ) : (
                <ChevronDown size={18} color="var(--color-jp-secondary)" />
              )}
            </div>

            {showJobDetails && (
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Job Posting URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://careers.company.com/job/12345 or company.com/job"
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-jp-secondary)', marginBottom: 6 }}>
                    Job Description / Notes
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste job requirements, responsibilities, or referral notes..."
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-jp-border)',
                      background: 'var(--color-jp-bg)',
                      color: 'var(--color-jp-text)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Bottom Error Alert */}
          {formError && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--color-status-rejected-bg)',
                border: '1px solid var(--color-status-rejected)',
                color: 'var(--color-status-rejected)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Bottom Success Alert */}
          {successMsg && (
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--color-status-offer-bg)',
                border: '1px solid var(--color-status-offer)',
                color: 'var(--color-status-offer)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
            <button
              type="button"
              onClick={() => navigate('/applications')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--color-jp-border)',
                background: 'transparent',
                color: 'var(--color-jp-secondary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                border: 'none',
                background: saving ? 'var(--color-jp-secondary)' : 'var(--color-jp-accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
