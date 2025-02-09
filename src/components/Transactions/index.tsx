import { useCallback, useState, useEffect } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [approvedUpdates, setApprovedUpdates] = useState<Record<string, boolean>>({})

  // Load stored transactions on mount
  useEffect(() => {
    const storedData = localStorage.getItem("transactions")
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      const storedApprovals = parsedData.updatedTransactions.reduce(
        (acc: Record<string, boolean>, txn: { id: string; newValue: boolean }) => {
          acc[txn.id] = txn.newValue
          return acc
        },
        {}
      )
      setApprovedUpdates(storedApprovals)
    }
  }, [])
  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })

      transactions?.forEach((transaction) => {
        if (transaction.id === transactionId) {
          transaction.approved = newValue
        }
      })

      const storedData = localStorage.getItem("transactions")
      const existingTransactions = storedData ? JSON.parse(storedData).updatedTransactions : []

      const updatedTransactions = [
        ...existingTransactions.filter((t: { id: string }) => t.id !== transactionId),
        { id: transactionId, newValue },
      ]

      localStorage.setItem("transactions", JSON.stringify({ updatedTransactions }))
      setApprovedUpdates((prev) => ({
        ...prev,
        [transactionId]: newValue,
      }))
    },
    [fetchWithoutCache, transactions]
  )

  console.log("transactions are", transactions)

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
          approvedStatus={approvedUpdates[transaction.id] ?? transaction.approved} // Use stored approval status if available
        />
      ))}
    </div>
  )
}
