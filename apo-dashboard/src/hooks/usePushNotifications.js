import { useState, useEffect } from 'react'

const VAPID_PUBLIC = 'BDbg7DUGYdE0gQTPyEnARM7RbwjgDkijc7MuOkiax_bsxnuKlY0Xy9cnzkUIITqfOXp06opJT_APkDbveBld0WA'

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - b64.length % 4) % 4)
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(supabase, tenantId) {
  const sb = supabase
  // idle | requesting | subscribed | denied | unsupported
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'granted')  setStatus('subscribed')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  const subscribe = async () => {
    if (status === 'unsupported' || !tenantId) return
    setStatus('requesting')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      let sub   = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })
      }
      const { endpoint, keys } = sub.toJSON()
      await sb.from('push_subscriptions').upsert(
        { endpoint, p256dh: keys.p256dh, auth: keys.auth, tenant_id: tenantId },
        { onConflict: 'endpoint' }
      )
      setStatus('subscribed')
    } catch (err) {
      console.error('Push subscribe:', err)
      setStatus('idle')
    }
  }

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch (err) {
      console.error('Push unsubscribe:', err)
    }
  }

  return { status, subscribe, unsubscribe }
}
