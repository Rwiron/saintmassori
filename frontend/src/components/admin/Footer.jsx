import { useNavigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Heart, School } from 'lucide-react'

export function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <School className="h-4 w-4 text-[#03a002]" />
              <span className="font-medium text-foreground">Saint Maria</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span>© {currentYear} All rights reserved</span>
          </div>

          {/* Center - Made with love */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for education</span>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/help')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Help
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/privacy')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/terms')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
} 