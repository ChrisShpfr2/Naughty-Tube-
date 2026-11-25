package org.wishy.browser.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

/**
 * Naughty Tube brand scheme matching the logo's crimson play red (#E1262D / #FF5258)
 * over deep brushed charcoal slate (#0E1217 / #161C24 / #1E2630).
 */
internal fun wishyBrandScheme(mode: String): ColorScheme {
    if (mode == "light") return lightColorScheme(
        primary = Color(0xFFC81E25), onPrimary = Color(0xFFFFFFFF), primaryContainer = Color(0xFFFFDAD8), onPrimaryContainer = Color(0xFF410005),
        inversePrimary = Color(0xFFFF6B70),
        secondary = Color(0xFF6B5356), onSecondary = Color(0xFFFFFFFF), secondaryContainer = Color(0xFFF5DDE0), onSecondaryContainer = Color(0xFF281619),
        tertiary = Color(0xFF945618), onTertiary = Color(0xFFFFFFFF), tertiaryContainer = Color(0xFFFFDCC0), onTertiaryContainer = Color(0xFF331800),
        background = Color(0xFFFAF6F6), onBackground = Color(0xFF191C21),
        surface = Color(0xFFFAF6F6), onSurface = Color(0xFF191C21),
        surfaceVariant = Color(0xFFEDE2E3), onSurfaceVariant = Color(0xFF5D5355), surfaceTint = Color(0xFFC81E25),
        inverseSurface = Color(0xFF1E242C), inverseOnSurface = Color(0xFFF4F6F8),
        error = Color(0xFFBA1A1A), onError = Color(0xFFFFFFFF), errorContainer = Color(0xFFFFDAD6), onErrorContainer = Color(0xFF410002),
        outline = Color(0xFF8A7B7D), outlineVariant = Color(0xFFE0D4D6), scrim = Color(0xFF000000),
        surfaceBright = Color(0xFFFFFFFF), surfaceDim = Color(0xFFE4D8DA),
        surfaceContainerLowest = Color(0xFFFFFFFF), surfaceContainerLow = Color(0xFFF7F1F1), surfaceContainer = Color(0xFFFFFFFF),
        surfaceContainerHigh = Color(0xFFF3E9EA), surfaceContainerHighest = Color(0xFFEBDFE0),
    )
    val dark = darkColorScheme(
        primary = Color(0xFFFF5258), onPrimary = Color(0xFF420006), primaryContainer = Color(0xFFA8141D), onPrimaryContainer = Color(0xFFFFDAD8),
        inversePrimary = Color(0xFFC81E25),
        secondary = Color(0xFFD6BFC2), onSecondary = Color(0xFF3A292B), secondaryContainer = Color(0xFF2A2024), onSecondaryContainer = Color(0xFFF5DFE1),
        tertiary = Color(0xFFF3B77C), onTertiary = Color(0xFF462600), tertiaryContainer = Color(0xFF633A0D), onTertiaryContainer = Color(0xFFFFDFC2),
        background = Color(0xFF0E1217), onBackground = Color(0xFFF3F5F8),
        surface = Color(0xFF0E1217), onSurface = Color(0xFFF3F5F8),
        surfaceVariant = Color(0xFF202731), onSurfaceVariant = Color(0xFFB3BCC8), surfaceTint = Color(0xFFFF5258),
        inverseSurface = Color(0xFFF3F5F8), inverseOnSurface = Color(0xFF191C21),
        error = Color(0xFFFFB4AB), onError = Color(0xFF690005), errorContainer = Color(0xFF93000A), onErrorContainer = Color(0xFFFFDAD6),
        outline = Color(0xFF6E7785), outlineVariant = Color(0xFF2E3744), scrim = Color(0xFF000000),
        surfaceBright = Color(0xFF2B3441), surfaceDim = Color(0xFF0A0D11),
        surfaceContainerLowest = Color(0xFF080A0E), surfaceContainerLow = Color(0xFF13181F), surfaceContainer = Color(0xFF181F28),
        surfaceContainerHigh = Color(0xFF202833), surfaceContainerHighest = Color(0xFF293340),
    )
    return when (mode) {
        "dusk" -> dark.copy(
            background = Color(0xFF161C24), surface = Color(0xFF161C24), surfaceDim = Color(0xFF161C24),
            surfaceContainerLowest = Color(0xFF10151B), surfaceContainerLow = Color(0xFF1A212B), surfaceContainer = Color(0xFF202935),
            surfaceContainerHigh = Color(0xFF27313F), surfaceContainerHighest = Color(0xFF303C4D), surfaceVariant = Color(0xFF303C4D),
        )
        "oled" -> dark.copy(
            background = Color.Black, surface = Color.Black, surfaceDim = Color.Black, surfaceContainerLowest = Color.Black,
            surfaceContainerLow = Color(0xFF0D1015), surfaceContainer = Color(0xFF141920), surfaceContainerHigh = Color(0xFF1C232D),
            surfaceContainerHighest = Color(0xFF242C38), surfaceVariant = Color(0xFF242C38),
        )
        else -> dark
    }
}
