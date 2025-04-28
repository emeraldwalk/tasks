import { createContext, useContext } from 'solid-js'
import type { Api } from '../data/api'

const ApiContext = createContext<Api>()

export const ApiProvider = ApiContext.Provider

export function useApi(): Api {
  const value = useContext(ApiContext)

  if (value == null) {
    throw new Error('No ApiContext value provided')
  }

  return value
}
