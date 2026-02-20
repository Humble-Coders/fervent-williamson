// UI Components barrel exports
import React from 'react';
import Alert from './Alert';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import Modal from './Modal';
import Input from './Input';
import Loading from './Loading';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import MultiSelect from './MultiSelect';
import Switch from './Switch';
import FormField from './FormField';
import ValidationSummary from './ValidationSummary';

export { Alert, Button, Card, Badge, Modal, Input, Loading, LoadingSpinner, EmptyState, MultiSelect, Switch, FormField, ValidationSummary };

// Re-export component prop types for better TypeScript support
export type AlertProps = React.ComponentProps<typeof Alert>;
export type ButtonProps = React.ComponentProps<typeof Button>;
export type CardProps = React.ComponentProps<typeof Card>;
export type BadgeProps = React.ComponentProps<typeof Badge>;
export type ModalProps = React.ComponentProps<typeof Modal>;
export type InputProps = React.ComponentProps<typeof Input>;
export type LoadingProps = React.ComponentProps<typeof Loading>;
export type LoadingSpinnerProps = React.ComponentProps<typeof LoadingSpinner>;
export type EmptyStateProps = React.ComponentProps<typeof EmptyState>;
export type MultiSelectProps = React.ComponentProps<typeof MultiSelect>;
export type SwitchProps = React.ComponentProps<typeof Switch>;
export type FormFieldProps = React.ComponentProps<typeof FormField>;
export type ValidationSummaryProps = React.ComponentProps<typeof ValidationSummary>;
