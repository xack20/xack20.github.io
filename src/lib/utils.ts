import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names and lets a later Tailwind class override an earlier one. */
export const cn = (...inputs: readonly ClassValue[]): string => twMerge(clsx(inputs));
