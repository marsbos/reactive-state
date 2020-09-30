import React from 'react'
import { createRxState, fromRxState, select, useStore } from './reactive-state'

const phoneStore = createRxState(['naw', 'phones'], [])
const cityState = createRxState(['naw', 'city'])
const derivedStore = fromRxState(
  select(phoneStore, '0'),
  select(phoneStore, '3'),
  cityState
)((values, set) => {
  console.log('DerivedState', values)
  set({ MYVALUE: values[2] })
})

export const App: React.FC<any> = () => {
  const [phones, setPhones] = useStore(phoneStore)
  const [city, setCity] = useStore(cityState)
  // const [derivedValue] = useStore(derivedStore)

  return (
    <>
      {phones &&
        phones.map((p: any, i) => {
          return <div key={'' + i}>PHONE={p}</div>
        })}
      <p>City: {city}</p>
      {/* <p>derivedValue: {derivedValue}</p> */}
      <button
        onClick={() =>
          setPhones((p) => [...p, Math.round(Math.random() * 1000)])
        }
        name='Add phone'
      >
        Add phone
      </button>
      <button onClick={() => setCity('' + Math.round(Math.random() * 10000))}>
        Set city
      </button>
    </>
  )
}
