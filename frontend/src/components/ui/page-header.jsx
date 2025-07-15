import { cn } from '@/lib/utils'

export function PageHeader({ 
  title, 
  description, 
  children, 
  className,
  variant = "default" 
}) {
  const variants = {
    default: "bg-gradient-to-r from-green-500 to-green-600",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600",
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg shadow-lg mb-6",
      variants[variant],
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-8 md:py-12">
        <div className="max-w-4xl">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {title}
          </h1>
          
          {/* Description */}
          {description && (
            <p className="text-lg text-green-100 mb-6 max-w-2xl">
              {description}
            </p>
          )}
          
          {/* Additional Content */}
          {children && (
            <div className="mt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 