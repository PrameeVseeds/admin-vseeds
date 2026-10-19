import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO, isValid } from 'date-fns';

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return typeof value === 'string' ? value : '—';
  return format(d, 'dd-MM-yyyy hh:mm a');
}

export function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return typeof value === 'string' ? value : '—';
  return format(d, 'yyyy-MM-dd');
}

@Pipe({ name: 'dateTime', standalone: true })
export class DateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDateTime(value);
  }
}

@Pipe({ name: 'dateOnly', standalone: true })
export class DateOnlyPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDateOnly(value);
  }
}
