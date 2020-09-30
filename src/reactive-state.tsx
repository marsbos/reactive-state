import * as R from 'ramda'
import { useCallback, useEffect, useState } from 'react'
import { BehaviorSubject, combineLatest, Observable } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

const subjectDefault = (() => new BehaviorSubject(undefined))()
const subjectDerived = (() => new BehaviorSubject(undefined))()

const pipeThroughLens = (s, l = null) =>
  s.pipe(lensView(l), distinctUntilChanged())

const createLens = (lens: R.Lens | string[] | string) => {
  const _createLens = (l: any) => {
    if (Array.isArray(l)) {
      return R.lensPath(l)
    }
    if (typeof lens === 'string') {
      return R.lensProp(lens)
    }
    return l
  }
  return _createLens(lens)
}

// Rxjs operator:
const lensView = (lens: R.Lens) => (
  source: Observable<any>
): Observable<any> => {
  return new Observable((subscriber) => {
    return source.subscribe({
      next(value) {
        const val = R.view(lens, value)
        if (!R.isNil(val)) {
          subscriber.next(val)
        }
      }
    })
  })
}

const prepareGetState = (store) => (subscriber) => {
  return store.subscribe({ next: subscriber })
}

const getObservable = (obsOrObj) =>
  obsOrObj instanceof Observable ? obsOrObj : R.prop('store')(obsOrObj)

export const select = (store, l: R.Lens | string[] | string) => {
  return pipeThroughLens(getObservable(store), createLens(l))
}

const all = (deps: any) => {
  const stores = deps
    .map((d) => {
      return getObservable(d)
    })
    .filter((s) => s !== undefined)
  return combineLatest(...stores)
}

export const fromRxState = (...stores) => {
  const combineStores = all(stores)
  const subscribe = prepareGetState(combineStores)
  const setDerivedState = (value) => subjectDerived.next(value)
  return (derivedStateCb) => {
    const { store, set } = createRxState('', null, combineStores)

    const subscription = subscribe((values) => {
      derivedStateCb(values, setDerivedState)
    })
    return { store, set }
  }
}

export const derived = ((subject: BehaviorSubject<any>) => {
  return (deps) => (...fns) => {
    return () => {
      const [depState, setDepState] = useState(undefined)
      useEffect(() => {
        if (deps && deps.length) {
          const stores = deps.map((d) => {
            const key = R.keys(d)[0]
            const store = d[key] instanceof Observable ? d[key] : d[key].store
            debugger
            return { key, store }
          })
          const subscription = combineLatest(
            stores.map((s) => s.store)
          ).subscribe({
            next: (values: any[]) => {
              debugger
              const mapValuesToKeys = values.reduce((m, c, idx) => {
                m[stores[idx].key] = c
                return m
              }, {})
              setDepState(mapValuesToKeys)
            }
          })
          return () => subscription.unsubscribe()
        }
      }, [])

      useEffect(() => {
        const setValue = fns.reduce((m, c) => {
          return m
        }, {})
        console.log('New setvalue', setValue)
      }, [depState])

      const setNextState = useCallback((value) => subject.next(value), [])

      return { ...depState, set: setNextState }
    }
  }
})(new BehaviorSubject(undefined))

export const useStore = ({ store, set }) => {
  const [state, setState] = useState(null)
  useEffect(() => {
    const subscribe = prepareGetState(store)
    const subscription = subscribe((value) => setState(value))
    return () => subscription.unsubscribe()
  }, [store])
  return [state, set]
}

export const createRxState = (
  lens: R.Lens | string[] | string,
  initialState?: any,
  subject?: any
) => {
  // create the lens
  const useTheLens = createLens(lens)
  const store: BehaviorSubject<any> = pipeThroughLens(
    subject || subjectDefault,
    useTheLens
  )

  const setState = (s) => (nextState) => {
    const setNextState = (value) => s.next(R.set(useTheLens, value, s.value))
    if (typeof nextState === 'function') {
      setNextState(nextState(R.view(useTheLens, s.value)))
    } else {
      setNextState(nextState)
    }
  }

  if (!R.isNil(initialState)) {
    setState(subject || subjectDefault)(initialState)
  }
  return {
    store,
    set: setState(subject || subjectDefault)
  }
}
