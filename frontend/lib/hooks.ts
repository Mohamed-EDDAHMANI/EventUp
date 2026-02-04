import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from '@/lib/store';

/** Use throughout the app instead of plain `useDispatch` */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Use throughout the app instead of plain `useSelector` */
export const useAppSelector = useSelector.withTypes<RootState>();

/** Use when you need the store instance (e.g. in middleware or getServerSideProps pattern) */
export const useAppStore = useStore.withTypes<AppStore>();
