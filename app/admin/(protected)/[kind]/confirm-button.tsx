'use client'
export default function ConfirmButton() { return <button className="danger" onClick={event => { if (!confirm('Move this entry to trash?')) event.preventDefault() }}>Trash</button> }
