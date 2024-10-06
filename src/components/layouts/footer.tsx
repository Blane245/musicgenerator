import { useCMGContext } from "../../contexts/cmgcontext"

export default function Footer() {
    const { status } = useCMGContext();
    return (
        <div className="page-footer">
            <p>
                {status}
            </p>
        </div>
    )
}