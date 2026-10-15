import { useEffect, useMemo, useState } from 'react'
import {
  Leaf, HeartHandshake, Utensils, MapPin, Clock3, Plus, Search,
  PackageCheck, Users, TrendingDown, Sparkles, RefreshCw, CheckCircle2,
  AlertCircle, Sprout, HandHeart, ChevronRight
} from 'lucide-react'

const API = 'http://127.0.0.1:5000/api'
const sampleNGOs = [
  { ngoName: 'Community Care NGO', location: 'Coimbatore', capacityKg: 25, foodCategories: ['Cooked Meals', 'Bakery'] },
  { ngoName: 'Hope Kitchen', location: 'Peelamedu, Coimbatore', capacityKg: 10, foodCategories: ['Cooked Meals'] },
  { ngoName: 'Neighbourhood Support Group', location: 'Coimbatore', capacityKg: 50, foodCategories: [] }
]

const demoDonations = [
  { id: 'demo-001', foodName: 'Vegetable rice and curry', category: 'Cooked Meals', quantityKg: 8, portions: 20, pickupDeadline: '2026-10-15T18:00', location: 'Coimbatore', donorName: 'Community Kitchen', notes: 'Confirm ingredients and allergens with donor.', status: 'Available' },
  { id: 'demo-002', foodName: 'Packaged bread', category: 'Bakery', quantityKg: 4, portions: 15, pickupDeadline: '2026-10-16T09:00', location: 'Peelamedu, Coimbatore', donorName: 'Demo Bakery', notes: 'Check package labels and date information.', status: 'Available' }
]

function formatDate(value) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function App() {
  const [donations, setDonations] = useState(demoDonations)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [notice, setNotice] = useState('')
  const [apiOnline, setApiOnline] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [impact, setImpact] = useState({ donationsListed: 2, donationsDelivered: 0, foodDeliveredKg: 0, demoMode: true })
  const [recommendations, setRecommendations] = useState([])
  const [form, setForm] = useState({
    foodName: '', category: 'Cooked Meals', quantityKg: '', portions: '',
    preparedAt: '', pickupDeadline: '', location: '', donorName: '', notes: ''
  })

  async function refresh() {
    setLoading(true)
    try {
      const [donationResponse, impactResponse] = await Promise.all([
        fetch(`${API}/donations`), fetch(`${API}/impact`)
      ])
      if (!donationResponse.ok || !impactResponse.ok) throw new Error('API unavailable')
      setDonations(await donationResponse.json())
      setImpact(await impactResponse.json())
      setApiOnline(true)
      setNotice('')
    } catch {
      setApiOnline(false)
      setNotice('Showing demo data. Start the Python backend to enable live local API actions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => donations.filter(d => {
    const haystack = `${d.foodName} ${d.category} ${d.location} ${d.donorName}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (filter === 'All' || d.status === filter)
  }), [donations, query, filter])

  async function addDonation(event) {
    event.preventDefault()
    const payload = { ...form, quantityKg: Number(form.quantityKg), portions: Number(form.portions || 0) }
    if (!payload.foodName || !payload.quantityKg || !payload.pickupDeadline || !payload.location || !payload.donorName) {
      setNotice('Please complete all required fields.')
      return
    }
    if (apiOnline) {
      try {
        const response = await fetch(`${API}/donations`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not add donation')
        setDonations(prev => [data, ...prev])
      } catch (err) {
        setNotice(err.message)
        return
      }
    } else {
      setDonations(prev => [{ ...payload, id: `local-${Date.now()}`, status: 'Available' }, ...prev])
      setNotice('Donation added to this demo session. Start backend for API persistence.')
    }
    setForm({ foodName: '', category: 'Cooked Meals', quantityKg: '', portions: '', preparedAt: '', pickupDeadline: '', location: '', donorName: '', notes: '' })
    setShowForm(false)
    setNotice('Donation listing created.')
    refresh()
  }

  async function claimDonation(donation) {
    const ngoName = window.prompt('Enter NGO / organization name to claim this donation:', 'Community Care NGO')
    if (!ngoName) return
    if (apiOnline) {
      try {
        const response = await fetch(`${API}/donations/${donation.id}/claim`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ngoName })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Claim failed')
        setDonations(prev => prev.map(d => d.id === data.id ? data : d))
        setNotice(`Claimed by ${ngoName}. Coordinate safe pickup with the donor.`)
      } catch (err) { setNotice(err.message) }
    } else {
      setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status: 'Claimed', claimedBy: ngoName } : d))
      setNotice('Demo claim recorded in the current page session.')
    }
  }

  async function updateStatus(donation, status) {
    if (apiOnline) {
      try {
        const response = await fetch(`${API}/donations/${donation.id}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Status update failed')
        setDonations(prev => prev.map(d => d.id === data.id ? data : d))
        setNotice(`Status updated: ${status}`)
        refresh()
      } catch (err) { setNotice(err.message) }
    } else {
      setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status } : d))
      setNotice(`Demo status updated: ${status}`)
    }
  }

  async function getMatches(donation) {
    if (!apiOnline) {
      const ranked = sampleNGOs.map(ngo => {
        const sameLocation = donation.location.toLowerCase().includes(ngo.location.toLowerCase()) || ngo.location.toLowerCase().includes(donation.location.toLowerCase())
        const categoryOk = !ngo.foodCategories.length || ngo.foodCategories.includes(donation.category)
        const capacityOk = ngo.capacityKg >= Number(donation.quantityKg)
        return { ...ngo, score: (sameLocation ? 35 : 0) + (capacityOk ? 30 : 10) + (categoryOk ? 20 : 0) + (donation.status === 'Available' ? 15 : 0), reasons: [sameLocation ? 'Location appears compatible' : 'Confirm location', capacityOk ? 'Capacity can cover quantity' : 'Confirm capacity', categoryOk ? 'Category compatible' : 'Confirm food category'] }
      }).sort((a,b) => b.score-a.score)
      setRecommendations(ranked)
      return
    }
    try {
      const response = await fetch(`${API}/match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donation, ngos: sampleNGOs })
      })
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch { setNotice('Could not load recommendations.') }
  }

  const availableCount = donations.filter(d => d.status === 'Available').length
  const deliveredCount = donations.filter(d => d.status === 'Delivered').length
  const totalKg = donations.reduce((sum, d) => sum + Number(d.quantityKg || 0), 0)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-icon"><Leaf size={22}/></span><span>Food Rescue <b>AI</b></span></a>
        <nav><a href="#donations">Donations</a><a href="#how-it-works">How it works</a><a href="#impact">SDG Impact</a></nav>
        <button className="button button-dark" onClick={() => { setShowForm(true); document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' }) }}><Plus size={17}/> Donate food</button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sprout size={16}/> FOOD FOR GOOD, WASTE FOR LESS</div>
            <h1>Rescue food.<br/><span>Feed hope.</span></h1>
            <p className="hero-description">A smarter way to connect surplus food with community organizations—before good food goes to waste.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => { setShowForm(true); document.getElementById('donation-form')?.scrollIntoView({ behavior: 'smooth' }) }}>List surplus food <ChevronRight size={18}/></button>
              <a className="button button-light" href="#donations">Explore donations</a>
            </div>
            <div className="sdg-row">
              <span className="sdg sdg-red"><b>2</b><span>ZERO<br/>HUNGER</span></span>
              <span className="sdg sdg-gold"><b>12</b><span>RESPONSIBLE<br/>CONSUMPTION</span></span>
            </div>
          </div>
          <div className="hero-art" aria-label="Food rescue illustration">
            <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
            <div className="art-circle"><Utensils size={58}/><HeartHandshake className="heart-icon" size={40}/></div>
            <div className="float-card float-card-top"><span className="mini-icon"><HandHeart size={20}/></span><span><b>One donation</b><small>Can make a difference</small></span></div>
            <div className="float-card float-card-bottom"><span className="green-dot"></span><span><b>Community first</b><small>Local food, local impact</small></span></div>
            <div className="leaf-decoration leaf-a"></div><div className="leaf-decoration leaf-b"></div>
          </div>
        </section>

        {notice && <div className="notice"><AlertCircle size={17}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        <div className={`api-status ${apiOnline ? 'online' : 'offline'}`}><span></span>{apiOnline ? 'Python API connected' : 'Demo mode'} <button onClick={refresh}><RefreshCw size={13}/> {loading ? 'Checking…' : 'Refresh'}</button></div>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon icon-green"><Utensils/></div><div><span>Donations listed</span><strong>{donations.length}</strong><small>Food rescue listings</small></div></div>
          <div className="stat-card"><div className="stat-icon icon-orange"><PackageCheck/></div><div><span>Available now</span><strong>{availableCount}</strong><small>Awaiting a recipient</small></div></div>
          <div className="stat-card"><div className="stat-icon icon-blue"><Users/></div><div><span>Delivered</span><strong>{deliveredCount}</strong><small>Recorded in this app</small></div></div>
          <div className="stat-card"><div className="stat-icon icon-lime"><TrendingDown/></div><div><span>Food listed</span><strong>{totalKg.toFixed(1)} <em>kg</em></strong><small>Not all quantities are rescued</small></div></div>
        </section>

        <section id="donations" className="section-block">
          <div className="section-heading"><div><div className="eyebrow">MAKE A DIFFERENCE TODAY</div><h2>Available food donations</h2><p>Browse surplus food and help coordinate a timely collection.</p></div><button className="button button-outline" onClick={() => setShowForm(v => !v)}><Plus size={17}/>{showForm ? 'Close form' : 'Add donation'}</button></div>

          {showForm && <form id="donation-form" className="donation-form" onSubmit={addDonation}>
            <div className="form-title"><div><h3>List surplus food</h3><p>Enter accurate details so an organization can assess collection.</p></div><span className="form-pill">Donor form</span></div>
            <div className="form-grid">
              <label>Food name *<input value={form.foodName} onChange={e => setForm({...form, foodName:e.target.value})} placeholder="e.g. Vegetable meals" required/></label>
              <label>Category *<select value={form.category} onChange={e => setForm({...form, category:e.target.value})}><option>Cooked Meals</option><option>Bakery</option><option>Packaged Food</option><option>Fruits & Vegetables</option><option>Dairy</option><option>Other</option></select></label>
              <label>Quantity (kg) *<input type="number" min="0.1" step="0.1" value={form.quantityKg} onChange={e => setForm({...form, quantityKg:e.target.value})} placeholder="e.g. 5" required/></label>
              <label>Estimated portions<input type="number" min="0" step="1" value={form.portions} onChange={e => setForm({...form, portions:e.target.value})} placeholder="Optional"/></label>
              <label>Prepared at<input type="datetime-local" value={form.preparedAt} onChange={e => setForm({...form, preparedAt:e.target.value})}/></label>
              <label>Pickup deadline *<input type="datetime-local" value={form.pickupDeadline} onChange={e => setForm({...form, pickupDeadline:e.target.value})} required/></label>
              <label>Pickup location *<input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="Area, city" required/></label>
              <label>Donor / organization name *<input value={form.donorName} onChange={e => setForm({...form, donorName:e.target.value})} placeholder="Organization name" required/></label>
              <label className="full-field">Handling, storage and allergen notes<textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Include relevant ingredients, allergens and storage details."/></label>
            </div>
            <p className="safety-note">Only list food that may be legally and safely donated. The platform does not certify food safety.</p>
            <button className="button button-primary" type="submit">Publish donation <ChevronRight size={17}/></button>
          </form>}

          <div className="filter-row"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search food, category or location"/></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Available</option><option>Claimed</option><option>Pickup Scheduled</option><option>Collected</option><option>Delivered</option><option>Cancelled</option><option>Expired</option></select></div>

          <div className="donation-grid">
            {filtered.map(donation => <article className="donation-card" key={donation.id}>
              <div className={`food-art ${donation.category === 'Bakery' ? 'food-bakery' : donation.category === 'Fruits & Vegetables' ? 'food-produce' : 'food-meal'}`}>
                <div className="food-art-icon">{donation.category === 'Bakery' ? '🥖' : donation.category === 'Fruits & Vegetables' ? '🥬' : '🍲'}</div>
                <span className={`status-pill status-${donation.status.toLowerCase().replaceAll(' ', '-')}`}>{donation.status}</span>
              </div>
              <div className="donation-body">
                <div className="category-label">{donation.category}</div>
                <h3>{donation.foodName}</h3>
                <div className="donation-meta"><span><PackageCheck size={15}/>{donation.quantityKg} kg</span>{donation.portions > 0 && <span><Users size={15}/>{donation.portions} portions*</span>}</div>
                <div className="donation-meta"><span><MapPin size={15}/>{donation.location}</span></div>
                <div className="deadline"><Clock3 size={15}/><span>Pickup by <b>{formatDate(donation.pickupDeadline)}</b></span></div>
                <p className="donor-name">Donated by {donation.donorName}</p>
                {donation.claimedBy && <p className="claimed-by">Claimed by {donation.claimedBy}</p>}
                <div className="card-actions">
                  {donation.status === 'Available' && <button className="button button-primary button-small" onClick={() => claimDonation(donation)}>Claim donation</button>}
                  <button className="button button-outline button-small" onClick={() => getMatches(donation)}><Sparkles size={15}/> AI match</button>
                  {donation.status === 'Claimed' && <button className="button button-light button-small" onClick={() => updateStatus(donation, 'Pickup Scheduled')}>Schedule pickup</button>}
                  {donation.status === 'Pickup Scheduled' && <button className="button button-light button-small" onClick={() => updateStatus(donation, 'Collected')}>Mark collected</button>}
                  {donation.status === 'Collected' && <button className="button button-light button-small" onClick={() => updateStatus(donation, 'Delivered')}>Mark delivered</button>}
                </div>
              </div>
            </article>)}
            {!filtered.length && <div className="empty-state"><Search size={32}/><h3>No donations found</h3><p>Try another search or change the status filter.</p></div>}
          </div>
          <p className="footnote">*Portions are donor estimates. Always confirm ingredients, allergens, storage and safe collection with the donor.</p>
        </section>

        {recommendations.length > 0 && <section className="section-block recommendations"><div className="section-heading"><div><div className="eyebrow">AI-ASSISTED SUGGESTIONS</div><h2>Suggested NGO matches</h2><p>Transparent demo scores to support—not replace—human coordination.</p></div><button className="button button-outline" onClick={() => setRecommendations([])}>Close</button></div>
          <div className="match-grid">{recommendations.map((ngo,i) => <div className="match-card" key={ngo.ngoName}><div className="match-top"><span className="rank">#{i+1}</span><div><h3>{ngo.ngoName}</h3><p><MapPin size={14}/>{ngo.location}</p></div><strong>{ngo.score}<small>/100</small></strong></div><div className="score-track"><span style={{width:`${ngo.score}%`}}/></div><ul>{(ngo.reasons || []).map(reason => <li key={reason}><CheckCircle2 size={14}/>{reason}</li>)}</ul></div>)}</div>
        </section>}

        <section id="how-it-works" className="section-block how-section">
          <div className="section-heading centered"><div><div className="eyebrow">SIMPLE STEPS, SHARED IMPACT</div><h2>How Food Rescue AI works</h2><p>A transparent workflow from food listing to delivery.</p></div></div>
          <div className="steps-grid">
            <div className="step"><div className="step-icon"><Utensils/></div><span>01</span><h3>Donor lists food</h3><p>Add quantity, category, location and a realistic pickup deadline.</p></div>
            <div className="step"><div className="step-icon"><Sparkles/></div><span>02</span><h3>System suggests matches</h3><p>Rank potential recipients using compatibility and time-sensitive details.</p></div>
            <div className="step"><div className="step-icon"><HeartHandshake/></div><span>03</span><h3>NGO claims donation</h3><p>Coordinate collection with the donor and confirm handling details.</p></div>
            <div className="step"><div className="step-icon"><PackageCheck/></div><span>04</span><h3>Track the outcome</h3><p>Update status and report the quantity delivered.</p></div>
          </div>
        </section>

        <section id="impact" className="impact-section">
          <div className="impact-copy"><div className="eyebrow"><Leaf size={16}/> OUR SUSTAINABILITY MISSION</div><h2>Small actions.<br/><span>Meaningful impact.</span></h2><p>Food Rescue AI supports a future where good food is handled responsibly and community organizations can find available donations more easily.</p><div className="impact-tags"><span><b>SDG 2</b> Zero Hunger</span><span><b>SDG 12</b> Responsible Consumption</span></div></div>
          <div className="impact-panel"><div className="impact-panel-title"><Sprout/><div><b>Impact dashboard</b><small>Based on application records</small></div></div><div className="impact-number-grid"><div><span>Donations delivered</span><strong>{deliveredCount}</strong></div><div><span>Food quantity listed</span><strong>{totalKg.toFixed(1)} kg</strong></div><div><span>Available listings</span><strong>{availableCount}</strong></div><div><span>Data mode</span><strong className="mode-label">{apiOnline ? 'API' : 'Demo'}</strong></div></div><p className="impact-disclaimer">Listed quantity is not the same as food rescued. Only quantities confirmed as delivered should be counted as delivered food. Demo figures are not verified community impact.</p></div>
        </section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-icon"><Leaf size={19}/></span><span>Food Rescue <b>AI</b></span></a><p>Rescue Food. Reduce Waste. Feed Communities.</p><span>SDG 2 · SDG 12</span></footer>
    </div>
  )
}

export default App
