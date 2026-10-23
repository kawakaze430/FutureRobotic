import {pageSEO} from '../lib/seo';
import type { Metadata } from 'next';
import './globals.css';
import './reference.css';
import './signed-workspace.css';
export const metadata:Metadata={title:'FutureRobotic AI — Convert, Generate, and Explain Code',description:'AI tools to convert, create, understand, review, and refine code in one developer workspace.',robots:pageSEO('/').robots,icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className="reference-theme">{children}</body></html>}
