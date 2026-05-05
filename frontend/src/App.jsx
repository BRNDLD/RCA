import './App.css'

import { useEffect, useMemo, useState } from 'react'

const NAV = [
  { id: 'nuevo', label: 'Nuevo RCA' },
  { id: 'mis', label: 'Mis RCA' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'enviados', label: 'Enviados a ProPlanes' },
  { id: 'config', label: 'Configuración' },
]

const STEPS = [
  { id: 'datos', label: 'Datos iniciales' },
  { id: 'hechos', label: 'Descripción de hechos' },
  { id: 'genero', label: '¿Por qué se generó?' },
  { id: 'detecto', label: '¿Por qué no se detectó?' },
  { id: 'causa', label: 'Causas raíz' },
]

async function api(path, options = {}) {
  const base = (import.meta.env.VITE_API_BASE || '').trim()
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const url = `${normalizedBase}/api${path}`
  const finalUrl = normalizedBase ? url : `/api${path}`

  const res = await fetch(finalUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    let body = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    const msg = body?.error ? String(body.error) : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return res.status === 204 ? null : res.json()
}

function makeRca() {
  return {
    id: null,
    status: 'draft',
    sam: {
      date: '',
      process: '',
      origin: '',
      department: '',
      investigationLead: '',
      role: '',
    },
    title: '',
    finding: '',
    factsDescription: '',
    reference: '',
    whereHappened: '',
    quantity: '',
    whyGenerated: '',
    whyNotDetected: '',
    rootCause: '',
    rootCategory: '',
  }
}

export default function App() {
  const [nav, setNav] = useState('nuevo')
  const [step, setStep] = useState('datos')
  const [completed, setCompleted] = useState(() => new Set())
  const [options, setOptions] = useState(null)
  const [rca, setRca] = useState(() => makeRca())
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [list, setList] = useState([])

  const stepIndex = useMemo(() => Math.max(0, STEPS.findIndex((s) => s.id === step)), [step])

  useEffect(() => {
    ;(async () => {
      try {
        const o = await api('/options')
        setOptions(o)
      } catch {
        setOptions({ origins: [], systems: [], actionTypes: [], yesNo: [], categories: {} })
      }
    })()
  }, [])

  async function refreshList(which) {
    const status = which === 'pendientes' ? 'draft' : which === 'enviados' ? 'published' : undefined
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const rows = await api(`/rcas${query}`)
    setList(rows)
  }

  useEffect(() => {
    if (nav === 'mis' || nav === 'pendientes' || nav === 'enviados') {
      refreshList(nav).catch(() => {})
    }
  }, [nav])

  function updateSam(key, value) {
    setRca((prev) => ({ ...prev, sam: { ...prev.sam, [key]: value } }))
  }

  function update(key, value) {
    setRca((prev) => ({ ...prev, [key]: value }))
  }

  async function saveDraft() {
    setBusy(true)
    setToast('')
    try {
      const payload = {
        sam: rca.sam,
        title: rca.title,
        finding: rca.finding,
        factsDescription: rca.factsDescription,
        reference: rca.reference,
        whereHappened: rca.whereHappened,
        quantity: rca.quantity,
        whyGenerated: rca.whyGenerated,
        whyNotDetected: rca.whyNotDetected,
        rootCause: rca.rootCause,
        rootCategory: rca.rootCategory,
      }
      const saved = rca.id
        ? await api(`/rcas/${rca.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/rcas', { method: 'POST', body: JSON.stringify(payload) })
      setRca((prev) => ({ ...prev, ...saved, id: saved.id }))
      setToast('Borrador guardado')
    } catch (e) {
      setToast(`Error al guardar: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setToast('')
    try {
      if (!rca.id) {
        await saveDraft()
      }
      const published = await api(`/rcas/${rca.id}/publish`, { method: 'POST' })
      setRca((prev) => ({ ...prev, ...published }))
      setToast('RCA publicado')
    } catch (e) {
      setToast(`Error al publicar: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  function confirmStep() {
    setCompleted((prev) => {
      const next = new Set(prev)
      next.add(step)
      return next
    })
    setToast('Paso confirmado')
  }

  function nextStep() {
    setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)].id)
  }
  function prevStep() {
    setStep(STEPS[Math.max(0, stepIndex - 1)].id)
  }

  function openRca(row) {
    setRca({
      id: row.id,
      status: row.status,
      sam: row.sam || makeRca().sam,
      title: row.title || '',
      finding: row.finding || '',
      factsDescription: row.factsDescription || '',
      reference: row.reference || '',
      whereHappened: row.whereHappened || '',
      quantity: row.quantity || '',
      whyGenerated: row.whyGenerated || '',
      whyNotDetected: row.whyNotDetected || '',
      rootCause: row.rootCause || '',
      rootCategory: row.rootCategory || '',
    })
    setNav('nuevo')
    setStep('datos')
    setToast(`Cargado SAM #${row.id}`)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-icon">⎘</div>
            <div className="brand-title">RCA Darnel</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn ghost" onClick={saveDraft} disabled={busy}>Guardar</button>
          <button className="btn primary" onClick={publish} disabled={busy}>Publicar</button>
        </div>
      </header>

      <div className="layout">
        <aside className="nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${nav === n.id ? 'active' : ''}`}
              onClick={() => setNav(n.id)}
              type="button"
            >
              <span className="nav-plus">{n.id === 'nuevo' ? '+' : '•'}</span>
              {n.label}
            </button>
          ))}
        </aside>

        <section className="content">
          {toast ? <div className="toast" role="status">{toast}</div> : null}

          {(nav === 'mis' || nav === 'pendientes' || nav === 'enviados') && (
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  {nav === 'mis' ? 'Mis RCA' : nav === 'pendientes' ? 'Pendientes' : 'Enviados a ProPlanes'}
                </div>
                <button className="btn ghost" onClick={() => refreshList(nav)} disabled={busy}>Refrescar</button>
              </div>
              <div className="table">
                <div className="table-row table-head">
                  <div>SAM</div>
                  <div>Proceso</div>
                  <div>Origen</div>
                  <div>Estado</div>
                  <div></div>
                </div>
                {list.map((row) => (
                  <div key={row.id} className="table-row">
                    <div>#{row.id}</div>
                    <div>{row.sam?.process || ''}</div>
                    <div>{row.sam?.origin || ''}</div>
                    <div className="pill">{row.status}</div>
                    <div>
                      <button className="btn link" onClick={() => openRca(row)}>Abrir</button>
                    </div>
                  </div>
                ))}
                {list.length === 0 ? <div className="empty">Sin resultados</div> : null}
              </div>
            </div>
          )}

          {nav === 'config' && (
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Configuración</div>
              </div>
              <div className="panel-body muted">Placeholder en esta versión rápida.</div>
            </div>
          )}

          {nav === 'nuevo' && (
            <>
              <div className="stepper" aria-label="Progreso">
                {STEPS.map((s, idx) => {
                  const done = completed.has(s.id) || idx < stepIndex
                  const active = s.id === step
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`step ${active ? 'active' : ''}`}
                      onClick={() => setStep(s.id)}
                    >
                      <span className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>{done ? '✓' : idx + 1}</span>
                      <span className="step-label">{s.label}</span>
                      {idx < STEPS.length - 1 ? <span className="step-line" /> : null}
                    </button>
                  )
                })}
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">
                    SAM #{rca.id ?? '—'}
                    <span className="panel-sub">{rca.status === 'published' ? 'Publicado' : 'En progreso'}</span>
                  </div>
                </div>

                <div className="panel-body">
                  {step === 'datos' && (
                    <>
                      <h3>Datos iniciales</h3>
                      <div className="grid3">
                        <Field label="Fecha" >
                          <input type="date" value={rca.sam.date} onChange={(e) => updateSam('date', e.target.value)} />
                        </Field>
                        <Field label="Proceso">
                          <input value={rca.sam.process} onChange={(e) => updateSam('process', e.target.value)} placeholder="Ej: Extrusión" />
                        </Field>
                        <Field label="Origen hallazgo">
                          <select value={rca.sam.origin} onChange={(e) => updateSam('origin', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {(options?.origins || []).map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="grid3">
                        <Field label="Departamento">
                          <input value={rca.sam.department} onChange={(e) => updateSam('department', e.target.value)} />
                        </Field>
                        <Field label="Líder de investigación">
                          <input value={rca.sam.investigationLead} onChange={(e) => updateSam('investigationLead', e.target.value)} />
                        </Field>
                        <Field label="Cargo">
                          <input value={rca.sam.role} onChange={(e) => updateSam('role', e.target.value)} />
                        </Field>
                      </div>
                    </>
                  )}

                  {step === 'hechos' && (
                    <>
                      <h3>Descripción de hechos</h3>
                      <div className="grid2">
                        <Field label="¿Cuál es el problema?">
                          <input value={rca.title} onChange={(e) => update('title', e.target.value)} placeholder="Ej: Defecto de sellado" />
                        </Field>
                        <Field label="Referencia (lote/factura)">
                          <input value={rca.reference} onChange={(e) => update('reference', e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid2">
                        <Field label="¿Dónde sucedió?">
                          <input value={rca.whereHappened} onChange={(e) => update('whereHappened', e.target.value)} />
                        </Field>
                        <Field label="¿Cuánto?">
                          <input value={rca.quantity} onChange={(e) => update('quantity', e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Hallazgo / No conformidad detectada">
                        <textarea value={rca.finding} onChange={(e) => update('finding', e.target.value)} rows={4} />
                      </Field>
                      <Field label="Descripción de los hechos">
                        <textarea value={rca.factsDescription} onChange={(e) => update('factsDescription', e.target.value)} rows={4} />
                      </Field>
                    </>
                  )}

                  {step === 'genero' && (
                    <>
                      <h3>¿Por qué se generó?</h3>
                      <div className="question">¿Por qué ocurrió el problema descrito?</div>
                      <Field label="Respuesta">
                        <input value={rca.whyGenerated} onChange={(e) => update('whyGenerated', e.target.value)} placeholder="Ingresa tu respuesta aquí..." />
                      </Field>
                      <Chips
                        title="Sugerencias"
                        items={pickSuggestions(options)}
                        onPick={(txt) => update('whyGenerated', txt)}
                      />
                    </>
                  )}

                  {step === 'detecto' && (
                    <>
                      <h3>¿Por qué no se detectó?</h3>
                      <div className="question">¿Por qué no se detectó oportunamente?</div>
                      <Field label="Respuesta">
                        <input value={rca.whyNotDetected} onChange={(e) => update('whyNotDetected', e.target.value)} placeholder="Ingresa tu respuesta aquí..." />
                      </Field>
                      <Chips
                        title="Sugerencias"
                        items={['Falta de verificación', 'Criterio de aceptación no claro', 'Inspección insuficiente']}
                        onPick={(txt) => update('whyNotDetected', txt)}
                      />
                    </>
                  )}

                  {step === 'causa' && (
                    <>
                      <h3>Causas raíz</h3>
                      <div className="grid2">
                        <Field label="Categoría">
                          <select value={rca.rootCategory} onChange={(e) => update('rootCategory', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {Object.keys(options?.categories || {}).map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Causa raíz">
                          <input value={rca.rootCause} onChange={(e) => update('rootCause', e.target.value)} placeholder="Ej: Incumplimiento al procedimiento" />
                        </Field>
                      </div>
                      {rca.rootCategory && (options?.categories?.[rca.rootCategory] || []).length ? (
                        <Chips
                          title={`Opciones (${rca.rootCategory})`}
                          items={(options?.categories?.[rca.rootCategory] || []).slice(0, 12)}
                          onPick={(txt) => update('rootCause', txt)}
                        />
                      ) : null}
                    </>
                  )}
                </div>

                <div className="panel-foot">
                  <button className="btn ghost" onClick={confirmStep} disabled={busy}>Confirmar</button>
                  <div className="spacer" />
                  <button className="btn ghost" onClick={prevStep} disabled={busy || stepIndex === 0}>Anterior</button>
                  <button className="btn primary" onClick={nextStep} disabled={busy || stepIndex === STEPS.length - 1}>Siguiente</button>
                </div>
              </div>

              <div className="panel compact">
                <div className="panel-head">
                  <div className="panel-title">Información completada</div>
                </div>
                <div className="panel-body summary">
                  <div className="summary-row"><span className="check">✓</span> Datos iniciales — <span className="muted">Proceso:</span> {rca.sam.process || '—'}</div>
                  <div className="summary-row"><span className="check">✓</span> Descripción de hechos — <span className="muted">Problema:</span> {rca.title || '—'}</div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="field">
      <div className="label">{label}</div>
      {children}
    </label>
  )
}

function Chips({ title, items, onPick }) {
  if (!items?.length) return null
  return (
    <div className="chips">
      <div className="chips-title">{title}</div>
      <div className="chips-row">
        {items.map((t) => (
          <button key={t} type="button" className="chip" onClick={() => onPick(t)}>{t}</button>
        ))}
      </div>
    </div>
  )
}

function pickSuggestions(options) {
  const cats = options?.categories || {}
  const pool = [
    ...(cats['Mano de Obra'] || []),
    ...(cats['Proceso'] || []),
  ]
  const base = [
    'Incumplimiento al Procedimiento',
    'Falta de estandarización',
    'Error en la calibración del equipo',
  ]
  const out = [...base]
  for (const s of pool) {
    if (out.length >= 8) break
    if (!out.includes(s)) out.push(s)
  }
  return out
}
