export interface FooterProps {
    status: string
}

export default function Footer(props: FooterProps) {
    const { status } = props
    return (
        <div className="page-footer">
            <p>
                {status}
            </p>
        </div>
    )
}