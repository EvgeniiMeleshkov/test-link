import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

// Типизированные обёртки над хуками react-redux.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
