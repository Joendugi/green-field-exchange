// Lazy-loaded components for better code splitting
import { lazy } from 'react';

// Heavy components that should only load when needed
export const AIAssistant = lazy(() => import('./AIAssistant'));
export const SocialFeedEnhanced = lazy(() => import('./SocialFeedEnhanced'));
export const AdminDashboardContent = lazy(() => import('./AdminDashboard'));
export const Marketplace = lazy(() => import('./Marketplace'));
export const MyProducts = lazy(() => import('./MyProducts'));
export const MyOrders = lazy(() => import('./MyOrders'));
export const Onboarding = lazy(() => import('./Onboarding'));
export const Profile = lazy(() => import('./Profile'));
export const Settings = lazy(() => import('./Settings'));
export const FarmerAnalytics = lazy(() => import('./FarmerAnalytics'));
export const OffersManager = lazy(() => import('./OffersManager'));
