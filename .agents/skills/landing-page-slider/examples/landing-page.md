```tsx
import { Slider } from './components/Slider'
import { Slide } from './components/Slider'
import { BulletList } from './components/Slider'
import { Sparkles } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <main>
        <Slider className="min-h-screen">
          {/* Slide 1 */}
          <Slide
            icon={Sparkles}
            subtitle="Session"
            title="Your Title Here"
            description="Your description here."
          />

          {/* Slide 2 with content */}
          <Slide
            title="Key Points"
            subtitle="Topic"
          >
            <BulletList items={[
              { title: 'Point 1', description: 'Description 1' },
              { title: 'Point 2', description: 'Description 2' },
              { title: 'Point 3', description: 'Description 3' },
            ]} />
          </Slide>

          {/* Slide 3 with split layout */}
          <Slide
            layout="split"
            title="Split Layout"
            description="Content on left, image on right"
            image="/path/to/image.png"
          >
            <BulletList items={[
              { title: 'Feature 1' },
              { title: 'Feature 2' },
            ]} />
          </Slide>
        </Slider>
      </main>
    </div>
  )
}

export default App
```
