// Proxy for react-router-dom to enable route messaging when needed
import * as ReactRouterDOM from 'react-router-dom-original';

// Re-export everything from the original react-router-dom
export * from 'react-router-dom-original';

// Override specific components if route messaging is enabled
declare const __ROUTE_MESSAGING_ENABLED__: boolean;

// Export components directly - the conditional logic can be handled at runtime if needed
export const HashRouter = ReactRouterDOM.HashRouter;
export const BrowserRouter = ReactRouterDOM.BrowserRouter;
export const Routes = ReactRouterDOM.Routes;
export const Route = ReactRouterDOM.Route;
export const Navigate = ReactRouterDOM.Navigate;
export const Link = ReactRouterDOM.Link;
export const NavLink = ReactRouterDOM.NavLink;
export const useNavigate = ReactRouterDOM.useNavigate;
export const useLocation = ReactRouterDOM.useLocation;
export const useParams = ReactRouterDOM.useParams;
export const useSearchParams = ReactRouterDOM.useSearchParams;

export default ReactRouterDOM;