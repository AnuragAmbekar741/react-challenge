import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [allTransactions, setAllTransactions] = useState<Transaction[] | null>([])
  const [hasMoreTransactions, setHasMoreTransactions] = useState<boolean>(true)

  const transactions = useMemo(
    () => (allTransactions?.length ? allTransactions : null),
    [allTransactions]
  )

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  useEffect(() => {
    if (paginatedTransactions?.data) {
      setHasMoreTransactions(paginatedTransactions?.nextPage !== null)
      setAllTransactions((prev) => {
        if (prev?.length) {
          return [...prev, ...paginatedTransactions.data]
        } else {
          return paginatedTransactions.data
        }
      })
    }
  }, [paginatedTransactions])

  useEffect(() => {
    if (transactionsByEmployee) {
      setAllTransactions(transactionsByEmployee)
    }
  }, [transactionsByEmployee])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeeUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue && newValue?.id) {
              setAllTransactions(null)
              await loadTransactionsByEmployee(newValue?.id)
            } else {
              setAllTransactions(null)
              await loadAllTransactions()
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && !transactionsByEmployee && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || !hasMoreTransactions}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
