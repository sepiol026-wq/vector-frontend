import Link from "next/link";
import { BanReleaseRedirect } from "./BanReleaseRedirect";
export default function Page() {
  return <main><h1>Access restricted</h1><p>This request was denied by the API.</p><Link href="/">Vector</Link><BanReleaseRedirect until={null} /></main>;
}
