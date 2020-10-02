### Statemanagement with RXJS, Ramda lenses & React Hooks (experimental phase)

This library makes it easy to implement (global) state.
It supports derived state as well, so you can easily collect state from different stores and turn it into its own store.
Just define the store(s) and you are good to go. 
Export them to be used everywhere in your app with the help of the useStore Hook.

Example usage:
*Create the stores*
```javascript
import { createRxState, fromRxState, select } from './reactive-state'

const phoneStore = createRxState(['naw', 'phones'], [])
const cityState = createRxState(['naw', 'city'])
const derivedStore = fromRxState(
  select(phoneStore, '0'),
  select(phoneStore, '3'),
  cityState
)((values, set) => {
  set({ myDerivedValue: `${values[0]}, ${values[1}, ${values[2}` })
})
```
