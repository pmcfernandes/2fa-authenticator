import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for managing accounts stored via the desktop API bridge.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load accounts from store on mount
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = useCallback(async () => {
    try {
      const stored = await window.api.getAccounts()
      setAccounts(stored || [])
    } catch (e) {
      console.error('Failed to load accounts:', e)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const saveAccounts = useCallback(async (newAccounts) => {
    try {
      await window.api.saveAccounts(newAccounts)
      setAccounts(newAccounts)
    } catch (e) {
      console.error('Failed to save accounts:', e)
    }
  }, [])

  const addAccount = useCallback(async (account) => {
    const next = await window.api.addAccount(account)
    setAccounts(next)
  }, [])

  const deleteAccount = useCallback(async (id) => {
    const next = await window.api.deleteAccount(id)
    setAccounts(next)
  }, [])

  const updateAccount = useCallback(async (id, data) => {
    const next = await window.api.updateAccount(id, data)
    setAccounts(next)
  }, [])

  const reorderAccounts = useCallback(async (ids) => {
    const next = await window.api.reorderAccounts(ids)
    setAccounts(next)
  }, [])

  const importAccounts = useCallback(async (newAccounts) => {
    const merged = [...accounts, ...newAccounts]
    await saveAccounts(merged)
  }, [accounts, saveAccounts])

  // Filtered accounts based on search
  const filteredAccounts = accounts.filter((account) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      account.issuer.toLowerCase().includes(q) ||
      account.label.toLowerCase().includes(q)
    )
  })

  return {
    accounts,
    filteredAccounts,
    loading,
    searchQuery,
    setSearchQuery,
    addAccount,
    deleteAccount,
    updateAccount,
    importAccounts,
    reorderAccounts,
    saveAccounts,
    reload: loadAccounts
  }
}
