import { useEffect, useRef } from 'react'
import { useLogging } from '../logging'

export const useWhyDidYouRender = (componentName: string, props: Record<string, any>, useEventLog?:boolean) => {
    const prevProps = useRef<Record<string, any>>({})
    const {logEvent} = useLogging(componentName)

    useEffect(() => {
        const changedProps: Record<string, { from: any, to: any }> = {}
        
        Object.keys(props).forEach(key => {
            if (prevProps.current[key] !== props[key]) {
                changedProps[key] = {
                    from: prevProps.current[key],
                    to: props[key]
                }
            }
        })

        if (Object.keys(changedProps).length > 0) {
            try {

                if (useEventLog) {
                    logEvent( {message:'re-render', componentName, cause: Object.keys(changedProps).map(key => 
                            `${key}: ${typeof changedProps[key].from} → ${typeof changedProps[key].to}`
                        ).join(', ') })

                }
                else {
                    console.log(`# [${componentName}] re-render caused by:`, 
                        Object.keys(changedProps).map(key => 
                            `${key}: ${typeof changedProps[key].from} → ${typeof changedProps[key].to}`
                        ).join(', ')
                    )

                }

            } catch {}
        }

        prevProps.current = props
    })
}