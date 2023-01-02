import {useEffect, useRef, useLayoutEffect} from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect


function useInterval(callback, delay) {
  const savedCallback = useRef(callback)

  // Remember the latest callback if it changes.
  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (!delay && delay !== 0) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(id)
  }, [delay])
}

export default useInterval

// const noop = () => {};

// export default function useIntervel(callback,delay, immediate){
//   // see https://github.com/Hermanya/use-interval/blob/master/src/index.tsx
//   // gatsby v3およびreact v17へのキャッチアップまでのつなぎ

//   const savedCallback = useRef(noop);

//   // Remember the latest callback.
//   useEffect(() => {
//     savedCallback.current = callback;
//   });

//   // Execute callback if immediate is set.
//   useEffect(() => {
//     if (!immediate) return;
//     if (delay === undefined || delay === null || delay === false) return;
//     savedCallback.current();
//   }, [immediate,delay]);

//   // Set up the interval.
//   useEffect(() => {
//     if (delay === undefined || delay === null || delay === false) return undefined;
//     const tick = () => savedCallback.current();
//     const id = setInterval(tick, delay);
//     return () => clearInterval(id);
//   }, [delay]);
// }