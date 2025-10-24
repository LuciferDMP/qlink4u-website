interface QRCodeWithLogoProps {
  url: string
  size?: number
  logoSize?: number
}

export default function QRCodeWithLogo({ url, size = 200, logoSize = 40 }: QRCodeWithLogoProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10`
  
  return (
    <div className="relative inline-block">
      {/* QR Code Background */}
      <img 
        src={qrUrl} 
        alt="QR Code" 
        className="block"
        style={{ width: size, height: size }}
      />
      
      {/* Logo Overlay */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-1 shadow-sm"
        style={{ 
          width: logoSize + 8, 
          height: logoSize + 8 
        }}
      >
        <img 
          src="/images/QLink4U.png" 
          alt="QLink4u Logo" 
          className="w-full h-full object-contain"
          style={{ 
            width: logoSize, 
            height: logoSize 
          }}
        />
      </div>
    </div>
  )
}